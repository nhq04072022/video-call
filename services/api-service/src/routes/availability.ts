import express, { Response } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schema for availability slot
const availabilitySlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  timezone: z.string().optional().default('UTC'),
  is_recurring: z.boolean().optional().default(true),
  valid_from: z.string().date().optional(),
  valid_until: z.string().date().optional(),
  is_active: z.boolean().optional().default(true),
});

// GET /api/mentors/me/availability - List all availability slots
router.get('/me/availability', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can manage availability
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can manage availability' });
    }

    const mentorId = req.user.id;

    const result = await pool.query(
      `SELECT 
        id,
        mentor_id,
        day_of_week,
        start_time,
        end_time,
        timezone,
        is_recurring,
        valid_from,
        valid_until,
        is_active,
        created_at,
        updated_at
      FROM mentor_availability_slots
      WHERE mentor_id = $1
      ORDER BY day_of_week ASC, start_time ASC`,
      [mentorId]
    );

    res.json({
      slots: result.rows.map((row: any) => ({
        id: row.id,
        mentor_id: row.mentor_id,
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        timezone: row.timezone,
        is_recurring: row.is_recurring,
        valid_from: row.valid_from ? row.valid_from.toISOString().split('T')[0] : null,
        valid_until: row.valid_until ? row.valid_until.toISOString().split('T')[0] : null,
        is_active: row.is_active,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })),
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error getting availability slots:', error);
    res.status(500).json({ error: 'Failed to get availability slots' });
  }
});

// POST /api/mentors/me/availability - Create availability slot
router.post('/me/availability', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can manage availability
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can manage availability' });
    }

    const mentorId = req.user.id;
    const validatedData = availabilitySlotSchema.parse(req.body);

    // Validate that end_time is after start_time
    const startTime = new Date(`2000-01-01T${validatedData.start_time}`);
    const endTime = new Date(`2000-01-01T${validatedData.end_time}`);
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'end_time must be after start_time' });
    }

    const result = await pool.query(
      `INSERT INTO mentor_availability_slots (
        mentor_id, day_of_week, start_time, end_time, timezone,
        is_recurring, valid_from, valid_until, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, mentor_id, day_of_week, start_time, end_time, timezone,
                is_recurring, valid_from, valid_until, is_active, created_at, updated_at`,
      [
        mentorId,
        validatedData.day_of_week,
        validatedData.start_time,
        validatedData.end_time,
        validatedData.timezone,
        validatedData.is_recurring,
        validatedData.valid_from || null,
        validatedData.valid_until || null,
        validatedData.is_active,
      ]
    );

    const slot = result.rows[0];
    res.status(201).json({
      id: slot.id,
      mentor_id: slot.mentor_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: slot.timezone,
      is_recurring: slot.is_recurring,
      valid_from: slot.valid_from ? slot.valid_from.toISOString().split('T')[0] : null,
      valid_until: slot.valid_until ? slot.valid_until.toISOString().split('T')[0] : null,
      is_active: slot.is_active,
      created_at: slot.created_at.toISOString(),
      updated_at: slot.updated_at.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error creating availability slot:', error);
    res.status(500).json({ error: 'Failed to create availability slot' });
  }
});

// PUT /api/mentors/me/availability/:slotId - Update availability slot
router.put('/me/availability/:slotId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can manage availability
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can manage availability' });
    }

    const mentorId = req.user.id;
    const { slotId } = req.params;
    const validatedData = availabilitySlotSchema.partial().parse(req.body);

    // Check if slot exists and belongs to mentor
    const existingSlot = await pool.query(
      'SELECT id FROM mentor_availability_slots WHERE id = $1 AND mentor_id = $2',
      [slotId, mentorId]
    );

    if (existingSlot.rows.length === 0) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (validatedData.day_of_week !== undefined) {
      updateFields.push(`day_of_week = $${paramIndex++}`);
      updateValues.push(validatedData.day_of_week);
    }
    if (validatedData.start_time !== undefined) {
      updateFields.push(`start_time = $${paramIndex++}`);
      updateValues.push(validatedData.start_time);
    }
    if (validatedData.end_time !== undefined) {
      updateFields.push(`end_time = $${paramIndex++}`);
      updateValues.push(validatedData.end_time);
    }
    if (validatedData.timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      updateValues.push(validatedData.timezone);
    }
    if (validatedData.is_recurring !== undefined) {
      updateFields.push(`is_recurring = $${paramIndex++}`);
      updateValues.push(validatedData.is_recurring);
    }
    if (validatedData.valid_from !== undefined) {
      updateFields.push(`valid_from = $${paramIndex++}`);
      updateValues.push(validatedData.valid_from || null);
    }
    if (validatedData.valid_until !== undefined) {
      updateFields.push(`valid_until = $${paramIndex++}`);
      updateValues.push(validatedData.valid_until || null);
    }
    if (validatedData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(validatedData.is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(slotId);

    const result = await pool.query(
      `UPDATE mentor_availability_slots 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, mentor_id, day_of_week, start_time, end_time, timezone,
                 is_recurring, valid_from, valid_until, is_active, created_at, updated_at`,
      updateValues
    );

    const slot = result.rows[0];
    res.json({
      id: slot.id,
      mentor_id: slot.mentor_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: slot.timezone,
      is_recurring: slot.is_recurring,
      valid_from: slot.valid_from ? slot.valid_from.toISOString().split('T')[0] : null,
      valid_until: slot.valid_until ? slot.valid_until.toISOString().split('T')[0] : null,
      is_active: slot.is_active,
      created_at: slot.created_at.toISOString(),
      updated_at: slot.updated_at.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error updating availability slot:', error);
    res.status(500).json({ error: 'Failed to update availability slot' });
  }
});

// DELETE /api/mentors/me/availability/:slotId - Delete availability slot
router.delete('/me/availability/:slotId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only mentors can manage availability
    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: 'Only mentors can manage availability' });
    }

    const mentorId = req.user.id;
    const { slotId } = req.params;

    // Check if slot exists and belongs to mentor
    const existingSlot = await pool.query(
      'SELECT id FROM mentor_availability_slots WHERE id = $1 AND mentor_id = $2',
      [slotId, mentorId]
    );

    if (existingSlot.rows.length === 0) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    await pool.query('DELETE FROM mentor_availability_slots WHERE id = $1', [slotId]);

    res.json({
      success: true,
      message: 'Availability slot deleted',
    });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ error: 'Failed to delete availability slot' });
  }
});

// GET /api/mentors/me/availability/check - Check if time slot is available
router.get('/me/availability/check', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const mentorId = req.user.id;
    const startTime = req.query.start_time as string;
    const endTime = req.query.end_time as string;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'start_time and end_time query parameters are required (ISO 8601 format)' });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const dayOfWeek = startDate.getDay();

    // Check if there's an availability slot for this day and time
    const availabilityResult = await pool.query(
      `SELECT id FROM mentor_availability_slots
       WHERE mentor_id = $1
         AND day_of_week = $2
         AND is_active = TRUE
         AND start_time <= $3::time
         AND end_time >= $4::time
         AND (valid_from IS NULL OR valid_from <= $5::date)
         AND (valid_until IS NULL OR valid_until >= $5::date)`,
      [mentorId, dayOfWeek, startDate.toTimeString().slice(0, 8), endDate.toTimeString().slice(0, 8), startDate.toISOString().split('T')[0]]
    );

    // Check if there's a conflicting session
    const conflictResult = await pool.query(
      `SELECT id FROM sessions
       WHERE mentor_id = $1
         AND status IN ('PENDING', 'ACCEPTED', 'ACTIVE')
         AND scheduled_time < $3::timestamp
         AND scheduled_time + INTERVAL '1 hour' * COALESCE(duration_minutes, 60) / 60 > $2::timestamp`,
      [mentorId, startTime, endTime]
    );

    const isAvailable = availabilityResult.rows.length > 0 && conflictResult.rows.length === 0;

    res.json({
      is_available: isAvailable,
      has_availability_slot: availabilityResult.rows.length > 0,
      has_conflict: conflictResult.rows.length > 0,
      conflicting_sessions: conflictResult.rows.map((row: any) => row.id),
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
