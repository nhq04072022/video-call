import express, { Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/mentors - List/search mentors
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get mentors from database (users with role = 'MENTOR')
    // Show all mentors regardless of is_public status
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.created_at,
              mp.bio, mp.title, mp.experience, mp.achievements, 
              mp.is_public, mp.average_rating
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       WHERE u.role = 'MENTOR'
       ORDER BY mp.average_rating DESC NULLS LAST, u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users u
       WHERE u.role = 'MENTOR'`
    );
    const total = parseInt(countResult.rows[0].total);

    const mentors = result.rows.map((row) => ({
      id: row.id,
      bio: row.bio || '',
      hourly_rate: 0, // TODO: Add to mentor_profiles table
      years_of_experience: null, // TODO: Add to mentor_profiles
      languages: [], // TODO: Add languages field
      profile_image_url: row.avatar_url || null,
      verification_status: 'verified' as const, // Default to verified
      is_available: true, // TODO: Check availability
      average_rating: parseFloat(row.average_rating) || 0.0,
      total_reviews: 0, // TODO: Calculate from reviews table
      total_sessions_completed: 0, // TODO: Calculate from sessions table
      expertise_areas: [], // TODO: Get from mentor_skills table
      // Additional fields for display
      full_name: row.full_name,
      email: row.email,
      title: row.title || '',
      experience: row.experience || '',
      achievements: row.achievements || '',
    }));

    res.json({
      mentors,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error listing mentors:', error);
    res.status(500).json({ error: 'Failed to list mentors' });
  }
});

// GET /api/mentors/:mentorId - Get mentor by ID
router.get('/:mentorId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { mentorId } = req.params;

    // Get mentor from database
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.created_at,
              mp.bio, mp.title, mp.experience, mp.achievements, 
              mp.is_public, mp.average_rating
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       WHERE u.id = $1 AND u.role = 'MENTOR'`,
      [mentorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const row = result.rows[0];

    const mentor = {
      id: row.id,
      bio: row.bio || '',
      hourly_rate: 0, // TODO: Add to mentor_profiles table
      years_of_experience: null, // TODO: Add to mentor_profiles
      languages: [], // TODO: Add languages field
      profile_image_url: row.avatar_url || null,
      verification_status: 'verified' as const, // Default to verified
      is_available: true, // TODO: Check availability
      average_rating: parseFloat(row.average_rating) || 0.0,
      total_reviews: 0, // TODO: Calculate from reviews table
      total_sessions_completed: 0, // TODO: Calculate from sessions table
      expertise_areas: [], // TODO: Get from mentor_skills table
      // Additional fields for display
      full_name: row.full_name,
      email: row.email,
      title: row.title || '',
      experience: row.experience || '',
      achievements: row.achievements || '',
    };

    res.json(mentor);
  } catch (error) {
    console.error('Error getting mentor:', error);
    res.status(500).json({ error: 'Failed to get mentor' });
  }
});


export default router;

