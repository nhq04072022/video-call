import express, { Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/mentors/me/calendar - Get calendar events for date range
router.get('/me/calendar', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can access calendar
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can access calendar' });
    }

    const mentorId = req.user.id;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'start_date and end_date query parameters are required' });
    }

    // Get sessions for the mentor within the date range
    const sessionsResult = await pool.query(
      `SELECT 
        s.id,
        s.mentor_id,
        s.mentee_id,
        s.status,
        s.scheduled_time,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.mentee_goal,
        s.mentee_questions,
        s.livekit_room_name,
        u.full_name as mentee_name,
        u.email as mentee_email
      FROM sessions s
      JOIN users u ON s.mentee_id = u.id
      WHERE s.mentor_id = $1
        AND s.scheduled_time >= $2::timestamp
        AND s.scheduled_time <= $3::timestamp
      ORDER BY s.scheduled_time ASC`,
      [mentorId, startDate, endDate]
    );

    const events = sessionsResult.rows.map((session) => {
      // Parse scheduled_time properly
      const scheduledTime = session.scheduled_time instanceof Date 
        ? new Date(session.scheduled_time.getTime())
        : new Date(session.scheduled_time);
      
      // Validate scheduledTime
      if (isNaN(scheduledTime.getTime())) {
        console.error(`Invalid scheduled_time for session ${session.id}:`, session.scheduled_time);
        return null;
      }
      
      // Calculate end time
      const duration = session.duration_minutes || 60;
      let endTime: Date;
      if (session.end_time) {
        endTime = session.end_time instanceof Date 
          ? new Date(session.end_time.getTime())
          : new Date(session.end_time);
        if (isNaN(endTime.getTime())) {
          endTime = new Date(scheduledTime.getTime() + duration * 60000);
        }
      } else {
        endTime = new Date(scheduledTime.getTime() + duration * 60000);
      }
      
      // Ensure endTime is after startTime
      if (endTime <= scheduledTime) {
        endTime = new Date(scheduledTime.getTime() + 60 * 60000);
      }
      
      return {
        id: session.id,
        title: `Session with ${session.mentee_name}`,
        start: scheduledTime.toISOString(),
        end: endTime.toISOString(),
        status: session.status,
        mentee_name: session.mentee_name,
        mentee_email: session.mentee_email,
        mentee_goal: session.mentee_goal,
        mentee_questions: session.mentee_questions,
        duration_minutes: session.duration_minutes || duration,
        livekit_room_name: session.livekit_room_name,
      };
    }).filter((event) => event !== null);

    res.json({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

// GET /api/mentors/me/calendar/events - Get events in FullCalendar format
router.get('/me/calendar/events', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can access calendar
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can access calendar' });
    }

    const mentorId = req.user.id;
    const start = req.query.start as string;
    const end = req.query.end as string;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query parameters are required (ISO 8601 format)' });
    }

    // Parse start and end dates for query
    // FullCalendar sends ISO 8601 strings, we need to ensure they're parsed correctly
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date format' });
    }
    
    console.log(`[Calendar API] Fetching events for mentor ${mentorId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get sessions for the mentor within the date range
    // PostgreSQL TIMESTAMP is timezone-naive, so we query using UTC timestamps
    const sessionsResult = await pool.query(
      `SELECT 
        s.id,
        s.mentor_id,
        s.mentee_id,
        s.status,
        s.scheduled_time,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.mentee_goal,
        s.mentee_questions,
        s.livekit_room_name,
        u.full_name as mentee_name,
        u.email as mentee_email
      FROM sessions s
      JOIN users u ON s.mentee_id = u.id
      WHERE s.mentor_id = $1
        AND s.scheduled_time >= $2::timestamp
        AND s.scheduled_time <= $3::timestamp
      ORDER BY s.scheduled_time ASC`,
      [mentorId, startDate, endDate]
    );
    
    console.log(`[Calendar API] Found ${sessionsResult.rows.length} sessions`);

    // Format for FullCalendar
    const events = sessionsResult.rows.map((session) => {
      // PostgreSQL returns TIMESTAMP as Date object
      // pg library automatically converts TIMESTAMP to JavaScript Date
      // The Date object represents the time in UTC, but when displayed it uses local timezone
      // We need to ensure we're working with the correct time
      let scheduledTime: Date;
      
      if (session.scheduled_time instanceof Date) {
        // PostgreSQL pg library returns Date object
        // The Date object internally stores UTC time, so we can use it directly
        scheduledTime = new Date(session.scheduled_time);
      } else if (typeof session.scheduled_time === 'string') {
        // If it's a string (shouldn't happen with pg, but handle it)
        scheduledTime = new Date(session.scheduled_time);
      } else {
        // Fallback - shouldn't happen
        console.warn(`Unexpected scheduled_time type for session ${session.id}:`, typeof session.scheduled_time);
        scheduledTime = new Date(session.scheduled_time);
      }
      
      // Validate scheduledTime is valid
      if (isNaN(scheduledTime.getTime())) {
        console.error(`[Calendar API] Invalid scheduled_time for session ${session.id}:`, session.scheduled_time, typeof session.scheduled_time);
        return null;
      }
      
      // Log for debugging
      console.log(`[Calendar API] Session ${session.id}: scheduled_time=${scheduledTime.toISOString()}, raw=${session.scheduled_time}`);
      
      // Calculate end time: use actual end_time if session has ended, otherwise use duration
      const duration = session.duration_minutes || 60; // Default 60 minutes
      let endTime: Date;
      
      if (session.end_time) {
        // Session has ended, use actual end_time
        if (session.end_time instanceof Date) {
          endTime = new Date(session.end_time.getTime());
        } else {
          endTime = new Date(session.end_time);
        }
        
        // Validate endTime
        if (isNaN(endTime.getTime())) {
          // Invalid end_time, calculate from scheduled_time + duration
          endTime = new Date(scheduledTime.getTime() + duration * 60000);
        }
      } else {
        // Session hasn't ended yet, calculate from scheduled_time + duration
        endTime = new Date(scheduledTime.getTime() + duration * 60000);
      }
      
      // Ensure endTime is after startTime
      if (endTime <= scheduledTime) {
        endTime = new Date(scheduledTime.getTime() + 60 * 60000); // Default to 1 hour
      }

      // Color based on status
      let backgroundColor = '#6366f1'; // Default purple
      let borderColor = '#4f46e5';
      if (session.status === 'PENDING') {
        backgroundColor = '#f59e0b'; // Amber
        borderColor = '#d97706';
      } else if (session.status === 'ACCEPTED') {
        backgroundColor = '#10b981'; // Green
        borderColor = '#059669';
      } else if (session.status === 'ACTIVE') {
        backgroundColor = '#3b82f6'; // Blue
        borderColor = '#2563eb';
      } else if (session.status === 'ENDED') {
        backgroundColor = '#6b7280'; // Gray
        borderColor = '#4b5563';
      } else if (session.status === 'CANCELED' || session.status === 'DECLINED') {
        backgroundColor = '#ef4444'; // Red
        borderColor = '#dc2626';
      }

      // Format title to be shorter for calendar display
      const menteeName = session.mentee_name || 'Unknown';
      const title = menteeName.length > 15 ? `${menteeName.substring(0, 15)}...` : menteeName;
      
      return {
        id: session.id,
        title: title,
        start: scheduledTime.toISOString(),
        end: endTime.toISOString(),
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        extendedProps: {
          status: session.status,
          mentee_name: session.mentee_name,
          mentee_email: session.mentee_email,
          mentee_goal: session.mentee_goal,
          mentee_questions: session.mentee_questions,
          duration_minutes: session.duration_minutes || duration,
          livekit_room_name: session.livekit_room_name,
          session_id: session.id,
        },
      };
    }).filter((event) => event !== null); // Filter out null events

    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

export default router;
