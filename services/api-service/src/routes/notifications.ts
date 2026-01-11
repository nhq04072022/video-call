import express, { Response } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schema for notification preferences
const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  notify_24h_before: z.boolean().optional(),
  notify_1h_before: z.boolean().optional(),
  notify_15min_before: z.boolean().optional(),
  notify_5min_before: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().nullable(),
  quiet_hours_end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().nullable(),
  timezone: z.string().optional(),
});

// GET /api/notifications - Get user notifications (with pagination)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const unreadOnly = req.query.unread_only === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Build query with proper parameter indexing
    let query = `SELECT 
      n.id,
      n.user_id,
      n.type,
      n.title,
      n.message,
      n.session_id,
      n.read_at,
      n.created_at,
      s.scheduled_time,
      s.status as session_status
    FROM notifications n
    LEFT JOIN sessions s ON n.session_id = s.id
    WHERE n.user_id = $1`;

    const params: any[] = [userId];

    if (unreadOnly) {
      query += ' AND n.read_at IS NULL';
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1';
    const countParams: any[] = [userId];
    if (unreadOnly) {
      countQuery += ' AND read_at IS NULL';
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || '0');

    res.json({
      notifications: result.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        session_id: row.session_id,
        read_at: row.read_at ? row.read_at.toISOString() : null,
        created_at: row.created_at.toISOString(),
        session: row.session_id
          ? {
              id: row.session_id,
              scheduled_time: row.scheduled_time ? row.scheduled_time.toISOString() : null,
              status: row.session_status,
            }
          : null,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ 
      error: 'Failed to get notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { notificationId } = req.params;

    // Check if notification exists and belongs to user
    const existingNotification = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (existingNotification.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Update read_at
    const result = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW()
       WHERE id = $1
       RETURNING id, read_at`,
      [notificationId]
    );

    res.json({
      success: true,
      notification_id: result.rows[0].id,
      read_at: result.rows[0].read_at.toISOString(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// GET /api/notifications/preferences - Get preferences
router.get('/preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        user_id,
        email_enabled,
        in_app_enabled,
        push_enabled,
        notify_24h_before,
        notify_1h_before,
        notify_15min_before,
        notify_5min_before,
        quiet_hours_start,
        quiet_hours_end,
        timezone,
        created_at,
        updated_at
      FROM notification_preferences
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if not set
      return res.json({
        user_id: userId,
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        notify_24h_before: true,
        notify_1h_before: true,
        notify_15min_before: true,
        notify_5min_before: true,
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        created_at: null,
        updated_at: null,
      });
    }

    const prefs = result.rows[0];
    res.json({
      user_id: prefs.user_id,
      email_enabled: prefs.email_enabled,
      in_app_enabled: prefs.in_app_enabled,
      push_enabled: prefs.push_enabled,
      notify_24h_before: prefs.notify_24h_before,
      notify_1h_before: prefs.notify_1h_before,
      notify_15min_before: prefs.notify_15min_before,
      notify_5min_before: prefs.notify_5min_before,
      quiet_hours_start: prefs.quiet_hours_start,
      quiet_hours_end: prefs.quiet_hours_end,
      timezone: prefs.timezone,
      created_at: prefs.created_at ? prefs.created_at.toISOString() : null,
      updated_at: prefs.updated_at ? prefs.updated_at.toISOString() : null,
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// PUT /api/notifications/preferences - Update preferences
router.put('/preferences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const validatedData = notificationPreferencesSchema.parse(req.body);

    // Check if preferences exist
    const existingPrefs = await pool.query(
      'SELECT user_id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingPrefs.rows.length === 0) {
      // Insert new preferences
      result = await pool.query(
        `INSERT INTO notification_preferences (
          user_id, email_enabled, in_app_enabled, push_enabled,
          notify_24h_before, notify_1h_before, notify_15min_before, notify_5min_before,
          quiet_hours_start, quiet_hours_end, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userId,
          validatedData.email_enabled ?? true,
          validatedData.in_app_enabled ?? true,
          validatedData.push_enabled ?? false,
          validatedData.notify_24h_before ?? true,
          validatedData.notify_1h_before ?? true,
          validatedData.notify_15min_before ?? true,
          validatedData.notify_5min_before ?? true,
          validatedData.quiet_hours_start || null,
          validatedData.quiet_hours_end || null,
          validatedData.timezone || 'UTC',
        ]
      );
    } else {
      // Update existing preferences
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (validatedData.email_enabled !== undefined) {
        updateFields.push(`email_enabled = $${paramIndex++}`);
        updateValues.push(validatedData.email_enabled);
      }
      if (validatedData.in_app_enabled !== undefined) {
        updateFields.push(`in_app_enabled = $${paramIndex++}`);
        updateValues.push(validatedData.in_app_enabled);
      }
      if (validatedData.push_enabled !== undefined) {
        updateFields.push(`push_enabled = $${paramIndex++}`);
        updateValues.push(validatedData.push_enabled);
      }
      if (validatedData.notify_24h_before !== undefined) {
        updateFields.push(`notify_24h_before = $${paramIndex++}`);
        updateValues.push(validatedData.notify_24h_before);
      }
      if (validatedData.notify_1h_before !== undefined) {
        updateFields.push(`notify_1h_before = $${paramIndex++}`);
        updateValues.push(validatedData.notify_1h_before);
      }
      if (validatedData.notify_15min_before !== undefined) {
        updateFields.push(`notify_15min_before = $${paramIndex++}`);
        updateValues.push(validatedData.notify_15min_before);
      }
      if (validatedData.notify_5min_before !== undefined) {
        updateFields.push(`notify_5min_before = $${paramIndex++}`);
        updateValues.push(validatedData.notify_5min_before);
      }
      if (validatedData.quiet_hours_start !== undefined) {
        updateFields.push(`quiet_hours_start = $${paramIndex++}`);
        updateValues.push(validatedData.quiet_hours_start);
      }
      if (validatedData.quiet_hours_end !== undefined) {
        updateFields.push(`quiet_hours_end = $${paramIndex++}`);
        updateValues.push(validatedData.quiet_hours_end);
      }
      if (validatedData.timezone !== undefined) {
        updateFields.push(`timezone = $${paramIndex++}`);
        updateValues.push(validatedData.timezone);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      result = await pool.query(
        `UPDATE notification_preferences 
         SET ${updateFields.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING *`,
        updateValues
      );
    }

    const prefs = result.rows[0];
    res.json({
      user_id: prefs.user_id,
      email_enabled: prefs.email_enabled,
      in_app_enabled: prefs.in_app_enabled,
      push_enabled: prefs.push_enabled,
      notify_24h_before: prefs.notify_24h_before,
      notify_1h_before: prefs.notify_1h_before,
      notify_15min_before: prefs.notify_15min_before,
      notify_5min_before: prefs.notify_5min_before,
      quiet_hours_start: prefs.quiet_hours_start,
      quiet_hours_end: prefs.quiet_hours_end,
      timezone: prefs.timezone,
      created_at: prefs.created_at.toISOString(),
      updated_at: prefs.updated_at.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
