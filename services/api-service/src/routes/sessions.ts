import express, { Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { CreateSessionRequest, CreateSessionResponse } from '../types';
import { createNotificationJobs, cancelNotificationJobs } from '../services/notificationService';

const router = express.Router();

// Fixed room name for the single meeting
const FIXED_ROOM_NAME = 'main-meeting-room';

// Validation schema for create session
const createSessionSchema = z.object({
  mentor_id: z.string().uuid('Invalid mentor ID format'),
  mentee_id: z.string().uuid('Invalid mentee ID format'),
  mentee_goal: z.string().min(1, 'Mentee goal is required').max(500, 'Mentee goal must be at most 500 characters'),
  mentee_questions: z.string().max(1000, 'Mentee questions must be at most 1000 characters').optional().default(''),
  scheduled_time: z.string().datetime('Invalid scheduled time format. Expected ISO 8601 format (e.g., 2024-01-15T10:30:00.000Z)'),
});

// GET /api/sessions/join-token - Get LiveKit join token (must come before /:sessionId)
router.get('/join-token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userName = req.user.email;
    const sessionId = req.query.sessionId as string | undefined;

    // Check if user exists in database
    const userResult = await pool.query('SELECT id, full_name FROM users WHERE id = $1', [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const displayName = userResult.rows[0].full_name || userName;

    // LiveKit configuration
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret || 
        livekitUrl === 'wss://your-livekit-server.com' ||
        apiKey === 'your-api-key' ||
        apiSecret === 'your-api-secret') {
      return res.status(500).json({ 
        error: 'LiveKit not configured',
        message: 'Please configure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend .env file'
      });
    }

    // Determine room name: use session's room if sessionId provided, otherwise use fixed room
    let roomName = FIXED_ROOM_NAME;
    let validSessionId: string | null = null;
    if (sessionId) {
      const sessionResult = await pool.query(
        'SELECT id, livekit_room_name, mentor_id, mentee_id FROM sessions WHERE id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        // Verify user is either mentor or mentee of this session
        if (userId === session.mentor_id || userId === session.mentee_id) {
          roomName = session.livekit_room_name || FIXED_ROOM_NAME;
          validSessionId = session.id;
          console.log(`[GET /join-token] ✓ Using session room: ${roomName} for sessionId: ${sessionId}, userId: ${userId}`);
        } else {
          console.warn(`[GET /join-token] ✗ User ${userId} not authorized for session ${sessionId}`);
          return res.status(403).json({ error: 'You are not authorized to join this session' });
        }
      } else {
        console.warn(`[GET /join-token] ✗ Session ${sessionId} not found in database`);
        return res.status(404).json({ error: 'Session not found' });
      }
    } else {
      console.log(`[GET /join-token] No sessionId provided, using fixed room: ${roomName}`);
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true, // Allow publishing data for chat
    });

    const token = await at.toJwt();

    console.log(`[GET /join-token] ✓ Token generated successfully - Room: ${roomName}, User: ${displayName} (${userId}), SessionId: ${sessionId || 'none'}`);

    // CRITICAL: Log participant join to database (no cache - everything in DB)
    if (validSessionId) {
      try {
        // Check if there's an active connection for this user in this session
        const activeConnection = await pool.query(
          `SELECT id, connection_count FROM session_participants 
           WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL 
           ORDER BY joined_at DESC LIMIT 1`,
          [validSessionId, userId]
        );

        if (activeConnection.rows.length > 0) {
          // Update connection count for reconnection
          await pool.query(
            `UPDATE session_participants 
             SET connection_count = connection_count + 1, updated_at = NOW() 
             WHERE id = $1`,
            [activeConnection.rows[0].id]
          );
          console.log(`[GET /join-token] ✓ Updated participant connection count in DB`);
        } else {
          // New connection - insert new record
          await pool.query(
            `INSERT INTO session_participants (session_id, user_id, joined_at, connection_count) 
             VALUES ($1, $2, NOW(), 1)`,
            [validSessionId, userId]
          );
          console.log(`[GET /join-token] ✓ Logged participant join to DB`);
        }
      } catch (dbError: any) {
        // Don't fail token generation if logging fails, but log the error
        if (dbError.code === '42P01') { // PostgreSQL error code for "relation does not exist"
          console.warn('[GET /join-token] session_participants table does not exist yet. Please run database migration.');
        } else {
          console.error('[GET /join-token] Error logging participant join:', dbError);
        }
      }
    }

    res.json({
      token,
      url: livekitUrl,
      roomName: roomName,
    });
  } catch (error) {
    console.error('Error generating join token:', error);
    res.status(500).json({ error: 'Failed to generate join token' });
  }
});

// GET /api/sessions/status - Get session status (must come before /:sessionId)
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return fixed room status
    res.json({
      roomName: FIXED_ROOM_NAME,
      status: 'ACCEPTED',
      isActive: false,
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

// GET /api/sessions - List sessions for current user (must come before /:sessionId)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const statusFilter = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Build query based on user role
    let query = '';
    let params: any[] = [];

    if (userRole === 'MENTOR') {
      query = `SELECT id, mentor_id, mentee_id, status, scheduled_time, 
                      start_time, end_time, duration_minutes, 
                      mentee_goal, mentee_questions, livekit_room_name, 
                      created_at, updated_at
               FROM sessions WHERE mentor_id = $1`;
      params.push(userId);
    } else {
      query = `SELECT id, mentor_id, mentee_id, status, scheduled_time, 
                      start_time, end_time, duration_minutes, 
                      mentee_goal, mentee_questions, livekit_room_name, 
                      created_at, updated_at
               FROM sessions WHERE mentee_id = $1`;
      params.push(userId);
    }

    // Add status filter if provided
    if (statusFilter) {
      query += ` AND status = $${params.length + 1}`;
      params.push(statusFilter.toUpperCase());
    }

    // Add ordering and pagination
    query += ` ORDER BY scheduled_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const sessions = result.rows.map((session: any) => ({
      id: session.id,
      mentor_id: session.mentor_id,
      mentee_id: session.mentee_id,
      status: session.status,
      scheduled_time: session.scheduled_time.toISOString(),
      start_time: session.start_time ? session.start_time.toISOString() : null,
      end_time: session.end_time ? session.end_time.toISOString() : null,
      duration_minutes: session.duration_minutes,
      mentee_goal: session.mentee_goal,
      mentee_questions: session.mentee_questions,
      livekit_room_name: session.livekit_room_name,
      created_at: session.created_at.toISOString(),
      updated_at: session.updated_at.toISOString(),
    }));

    res.json({ sessions, total: sessions.length });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// POST /api/sessions/create - Create a new session with Auto-Accept logic
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = createSessionSchema.parse(req.body) as CreateSessionRequest;

    // Check if mentor exists
    const mentorResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [
      validatedData.mentor_id,
    ]);

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (mentorResult.rows[0].role !== 'MENTOR') {
      return res.status(400).json({ error: 'User is not a mentor' });
    }

    // Check if mentee exists
    const menteeResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [
      validatedData.mentee_id,
    ]);

    if (menteeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found' });
    }

    if (menteeResult.rows[0].role !== 'MENTEE') {
      return res.status(400).json({ error: 'User is not a mentee' });
    }

    // Verify that the authenticated user is the mentee
    if (req.user.id !== validatedData.mentee_id) {
      return res.status(403).json({ error: 'You can only create sessions for yourself as a mentee' });
    }

    // Generate unique livekit_room_name (format: session-{uuid})
    const sessionId = randomUUID();
    const livekitRoomName = `session-${sessionId}`;

    // Parse and validate scheduled_time
    // scheduled_time comes as ISO 8601 string (e.g., "2024-01-15T10:30:00.000Z")
    let scheduledTime: Date;
    try {
      // Parse the ISO 8601 string to Date object
      scheduledTime = new Date(validatedData.scheduled_time);
      
      // Validate the date is valid
      if (isNaN(scheduledTime.getTime())) {
        console.error(`[Create Session] Invalid scheduled_time format: ${validatedData.scheduled_time}`);
        return res.status(400).json({ 
          error: 'Invalid scheduled_time format. Expected ISO 8601 datetime string (e.g., 2024-01-15T10:30:00.000Z).' 
        });
      }
      
      // Ensure scheduled_time is in the future
      const now = new Date();
      if (scheduledTime <= now) {
        return res.status(400).json({ error: 'scheduled_time must be in the future' });
      }
      
      console.log(`[Create Session] Parsed scheduled_time: ${scheduledTime.toISOString()} (UTC)`);
    } catch (error) {
      console.error(`[Create Session] Error parsing scheduled_time: ${validatedData.scheduled_time}`, error);
      return res.status(400).json({ 
        error: 'Invalid scheduled_time format. Expected ISO 8601 datetime string.' 
      });
    }

    // Create session in DB with status = 'PENDING' (waiting for mentor approval)
    // PostgreSQL TIMESTAMP stores without timezone
    // pg library automatically converts JavaScript Date to PostgreSQL TIMESTAMP
    // The Date object's UTC time is stored in the TIMESTAMP column
    const result = await pool.query(
      `INSERT INTO sessions (
        id, mentor_id, mentee_id, status, scheduled_time, 
        mentee_goal, mentee_questions, livekit_room_name
      ) VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7)
      RETURNING id, mentor_id, mentee_id, status, scheduled_time, 
                mentee_goal, mentee_questions, livekit_room_name, 
                created_at, updated_at`,
      [
        sessionId,
        validatedData.mentor_id,
        validatedData.mentee_id,
        scheduledTime, // pg library converts Date to TIMESTAMP
        validatedData.mentee_goal,
        validatedData.mentee_questions,
        livekitRoomName,
      ]
    );
    
    console.log(`[Create Session] Created session ${sessionId} with scheduled_time: ${result.rows[0].scheduled_time}`);

    const session = result.rows[0];

    // Create notification jobs for mentor (non-blocking)
    try {
      const scheduledTime = new Date(session.scheduled_time);
      await createNotificationJobs(session.id, scheduledTime, validatedData.mentor_id);
    } catch (notificationError) {
      console.error('Error creating notification jobs (non-critical):', notificationError);
      // Don't fail the request if notification job creation fails
    }

    const response: CreateSessionResponse = {
      id: session.id,
      mentor_id: session.mentor_id,
      mentee_id: session.mentee_id,
      status: session.status,
      scheduled_time: session.scheduled_time.toISOString(),
      mentee_goal: session.mentee_goal,
      mentee_questions: session.mentee_questions,
      livekit_room_name: session.livekit_room_name,
      created_at: session.created_at.toISOString(),
      updated_at: session.updated_at.toISOString(),
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error creating session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});

// GET /api/sessions/:sessionId - Get session detail
router.get('/:sessionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;

    // Get session from database
    const result = await pool.query(
      `SELECT id, mentor_id, mentee_id, status, scheduled_time, 
              start_time, end_time, duration_minutes, 
              mentee_goal, mentee_questions, livekit_room_name, 
              created_at, updated_at
       FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Verify user is either mentor or mentee of the session
    if (req.user.id !== session.mentor_id && req.user.id !== session.mentee_id) {
      return res.status(403).json({ error: 'You are not authorized to view this session' });
    }

    res.json({
      id: session.id,
      mentor_id: session.mentor_id,
      mentee_id: session.mentee_id,
      status: session.status,
      scheduled_time: session.scheduled_time.toISOString(),
      start_time: session.start_time ? session.start_time.toISOString() : null,
      end_time: session.end_time ? session.end_time.toISOString() : null,
      duration_minutes: session.duration_minutes,
      mentee_goal: session.mentee_goal,
      mentee_questions: session.mentee_questions,
      livekit_room_name: session.livekit_room_name,
      created_at: session.created_at.toISOString(),
      updated_at: session.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});


// POST /api/sessions/start - Start session (Mentor only)
router.post('/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can start sessions
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can start sessions' });
    }

    const sessionId = req.body.sessionId || req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session from database
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, status, livekit_room_name FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is the mentor of this session
    if (req.user.id !== session.mentor_id) {
      return res.status(403).json({ error: 'You are not authorized to start this session' });
    }

    // Update session status to ACTIVE and set start_time
    const updateResult = await pool.query(
      `UPDATE sessions 
       SET status = 'ACTIVE', start_time = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, status, start_time, livekit_room_name`,
      [sessionId]
    );

    const updatedSession = updateResult.rows[0];

    res.json({
      success: true,
      message: 'Session started',
      session_id: updatedSession.id,
      status: updatedSession.status,
      start_time: updatedSession.start_time.toISOString(),
      roomName: updatedSession.livekit_room_name || FIXED_ROOM_NAME,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/sessions/end - End session
router.post('/end', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionId = req.body.sessionId || req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session from database
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, mentee_id, start_time FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is either mentor or mentee of this session
    if (req.user.id !== session.mentor_id && req.user.id !== session.mentee_id) {
      return res.status(403).json({ error: 'You are not authorized to end this session' });
    }

    // Calculate duration_minutes if start_time exists
    let durationMinutes = null;
    if (session.start_time) {
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    // Update session status to ENDED, set end_time and duration_minutes
    const updateResult = await pool.query(
      `UPDATE sessions 
       SET status = 'ENDED', end_time = NOW(), duration_minutes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, end_time, duration_minutes`,
      [durationMinutes, sessionId]
    );

    const updatedSession = updateResult.rows[0];

    // CRITICAL: Mark all active participants as left (no cache - everything in DB)
    try {
      await pool.query(
        `UPDATE session_participants 
         SET left_at = NOW(), updated_at = NOW() 
         WHERE session_id = $1 AND left_at IS NULL`,
        [sessionId]
      );
      console.log(`[POST /end] ✓ Marked all participants as left in DB`);
    } catch (dbError) {
      console.error('[POST /end] Error marking participants as left:', dbError);
    }

    res.json({
      success: true,
      message: 'Session ended',
      session_id: updatedSession.id,
      status: updatedSession.status,
      end_time: updatedSession.end_time.toISOString(),
      duration_minutes: updatedSession.duration_minutes,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// POST /api/sessions/emergency-terminate - Emergency terminate session
router.post('/emergency-terminate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionId = req.body.sessionId || req.query.sessionId as string;
    const { terminated_by, emergency_reason, emergency_notes } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session from database
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, mentee_id, start_time, status FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is either mentor or mentee of this session
    if (req.user.id !== session.mentor_id && req.user.id !== session.mentee_id) {
      return res.status(403).json({ error: 'You are not authorized to terminate this session' });
    }

    // Calculate duration_minutes if start_time exists
    let durationMinutes = null;
    if (session.start_time) {
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    // Update session status to CANCELED (emergency termination), set end_time and duration_minutes
    const updateResult = await pool.query(
      `UPDATE sessions 
       SET status = 'CANCELED', end_time = NOW(), duration_minutes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, end_time, duration_minutes`,
      [durationMinutes, sessionId]
    );

    // Cancel notification jobs (non-blocking)
    try {
      await cancelNotificationJobs(sessionId);
    } catch (notificationError) {
      console.error('Error canceling notification jobs (non-critical):', notificationError);
      // Don't fail the request if notification job cancellation fails
    }

    const updatedSession = updateResult.rows[0];

    // Mark all active participants as left
    try {
      await pool.query(
        `UPDATE session_participants 
         SET left_at = NOW(), updated_at = NOW() 
         WHERE session_id = $1 AND left_at IS NULL`,
        [sessionId]
      );
      console.log(`[POST /emergency-terminate] ✓ Marked all participants as left in DB`);
    } catch (dbError) {
      console.error('[POST /emergency-terminate] Error marking participants as left:', dbError);
    }

    // Log emergency termination details
    console.log(`[POST /emergency-terminate] Emergency termination - Session: ${sessionId}, By: ${terminated_by || req.user.id}, Reason: ${emergency_reason || 'not specified'}, Notes: ${emergency_notes || 'none'}`);

    res.json({
      success: true,
      message: 'Session emergency terminated',
      session_id: updatedSession.id,
      status: updatedSession.status,
      end_time: updatedSession.end_time.toISOString(),
      duration_minutes: updatedSession.duration_minutes,
      emergency_reason: emergency_reason || null,
    });
  } catch (error) {
    console.error('Error emergency terminating session:', error);
    res.status(500).json({ error: 'Failed to emergency terminate session' });
  }
});

// POST /api/sessions/:sessionId/accept - Accept session (Mentor only)
router.post('/:sessionId/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can accept sessions
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can accept sessions' });
    }

    const { sessionId } = req.params;

    // Get session from database
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, status FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is the mentor of this session
    if (req.user.id !== session.mentor_id) {
      return res.status(403).json({ error: 'You are not authorized to accept this session' });
    }

    // Only accept if status is PENDING
    if (session.status !== 'PENDING') {
      return res.status(400).json({ error: `Session is already ${session.status}. Cannot accept.` });
    }

    // Get full session details including scheduled_time
    const fullSessionResult = await pool.query(
      'SELECT id, mentor_id, scheduled_time FROM sessions WHERE id = $1',
      [sessionId]
    );
    const fullSession = fullSessionResult.rows[0];

    // Update session status to ACCEPTED
    const updateResult = await pool.query(
      `UPDATE sessions 
       SET status = 'ACCEPTED', updated_at = NOW()
       WHERE id = $1
       RETURNING id, status, scheduled_time, livekit_room_name`,
      [sessionId]
    );

    const updatedSession = updateResult.rows[0];

    // Create notification jobs for mentor (non-blocking)
    try {
      const scheduledTime = new Date(fullSession.scheduled_time);
      await createNotificationJobs(sessionId, scheduledTime, fullSession.mentor_id);
    } catch (notificationError) {
      console.error('Error creating notification jobs (non-critical):', notificationError);
      // Don't fail the request if notification job creation fails
    }

    res.json({
      success: true,
      message: 'Session accepted',
      session_id: updatedSession.id,
      status: updatedSession.status,
      scheduled_time: updatedSession.scheduled_time.toISOString(),
      room_name: updatedSession.livekit_room_name,
    });
  } catch (error) {
    console.error('Error accepting session:', error);
    res.status(500).json({ error: 'Failed to accept session' });
  }
});

// POST /api/sessions/:sessionId/reject - Reject session (Mentor only)
router.post('/:sessionId/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can reject sessions
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can reject sessions' });
    }

    const { sessionId } = req.params;
    const { reason } = req.body; // Optional rejection reason

    // Get session from database
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, status FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is the mentor of this session
    if (req.user.id !== session.mentor_id) {
      return res.status(403).json({ error: 'You are not authorized to reject this session' });
    }

    // Only reject if status is PENDING
    if (session.status !== 'PENDING') {
      return res.status(400).json({ error: `Session is already ${session.status}. Cannot reject.` });
    }

    // Update session status to DECLINED
    const updateResult = await pool.query(
      `UPDATE sessions 
       SET status = 'DECLINED', updated_at = NOW()
       WHERE id = $1
       RETURNING id, status`,
      [sessionId]
    );

    const updatedSession = updateResult.rows[0];

    // Cancel notification jobs (non-blocking)
    try {
      await cancelNotificationJobs(sessionId);
    } catch (notificationError) {
      console.error('Error canceling notification jobs (non-critical):', notificationError);
      // Don't fail the request if notification job cancellation fails
    }

    // Log rejection reason if provided
    if (reason) {
      console.log(`[POST /:sessionId/reject] Session ${sessionId} rejected. Reason: ${reason}`);
    }

    res.json({
      success: true,
      message: 'Session rejected',
      session_id: updatedSession.id,
      status: updatedSession.status,
    });
  } catch (error) {
    console.error('Error rejecting session:', error);
    res.status(500).json({ error: 'Failed to reject session' });
  }
});

// POST /api/sessions/:sessionId/leave - Log participant leave event
router.post('/:sessionId/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify session exists and user is authorized
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, mentee_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (userId !== session.mentor_id && userId !== session.mentee_id) {
      return res.status(403).json({ error: 'You are not authorized for this session' });
    }

    // CRITICAL: Mark participant as left (no cache - everything in DB)
    // Handle case where table might not exist yet (migration not run)
    try {
      // First, get the most recent active participant record for this user in this session
      const activeParticipantResult = await pool.query(
        `SELECT id FROM session_participants 
         WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL 
         ORDER BY joined_at DESC LIMIT 1`,
        [sessionId, userId]
      );

      if (activeParticipantResult.rows.length > 0) {
        const participantId = activeParticipantResult.rows[0].id;
        // Update that specific record
        await pool.query(
          `UPDATE session_participants 
           SET left_at = NOW(), updated_at = NOW() 
           WHERE id = $1`,
          [participantId]
        );
        console.log(`[POST /:sessionId/leave] ✓ Logged participant leave to DB - Session: ${sessionId}, User: ${userId}`);
      } else {
        console.log(`[POST /:sessionId/leave] No active participant record found - Session: ${sessionId}, User: ${userId}`);
      }

      res.json({
        success: true,
        message: 'Participant leave logged',
      });
    } catch (dbError: any) {
      // If table doesn't exist, just log and return success (non-critical operation)
      if (dbError.code === '42P01') { // PostgreSQL error code for "relation does not exist"
        console.warn('[POST /:sessionId/leave] session_participants table does not exist yet. Please run database migration.');
        res.json({
          success: true,
          message: 'Participant leave logged (table not found - migration may be needed)',
        });
      } else {
        throw dbError; // Re-throw other errors
      }
    }
  } catch (error) {
    console.error('Error logging participant leave:', error);
    // Don't fail the request if logging fails - this is non-critical
    res.status(200).json({
      success: true,
      message: 'Participant leave logging attempted (may have failed)',
      warning: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/sessions/:sessionId/participants - Get current participants in session
router.get('/:sessionId/participants', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;

    // Verify session exists and user is authorized
    const sessionResult = await pool.query(
      'SELECT id, mentor_id, mentee_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (req.user.id !== session.mentor_id && req.user.id !== session.mentee_id) {
      return res.status(403).json({ error: 'You are not authorized for this session' });
    }

    // Get all active participants from database (no cache - everything from DB)
    const participantsResult = await pool.query(
      `SELECT sp.id, sp.user_id, sp.joined_at, sp.connection_count, 
              u.full_name, u.email, u.role
       FROM session_participants sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.session_id = $1 AND sp.left_at IS NULL
       ORDER BY sp.joined_at ASC`,
      [sessionId]
    );

    const participants = participantsResult.rows.map((row: any) => ({
      id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      joined_at: row.joined_at.toISOString(),
      connection_count: row.connection_count,
    }));

    res.json({
      session_id: sessionId,
      participants,
      total: participants.length,
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});


export default router;

