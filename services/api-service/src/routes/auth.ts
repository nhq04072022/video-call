import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserRole,
} from '../types';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['MENTOR', 'MENTEE'], {
    errorMap: () => ({ message: 'Role must be MENTOR or MENTEE' }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterRequest;

    // Check database connection
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        error: 'Database not connected. Please setup PostgreSQL database first.',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined,
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role`,
      [
        validatedData.email,
        password_hash,
        validatedData.full_name,
        validatedData.role,
      ]
    );

    const user = result.rows[0];

    // Create mentor profile if role is MENTOR
    if (validatedData.role === 'MENTOR') {
      try {
        await pool.query(
          `INSERT INTO mentor_profiles (user_id, is_public)
           VALUES ($1, TRUE)
           ON CONFLICT DO NOTHING`,
          [user.id]
        );
      } catch (profileError) {
        // If mentor_profiles table doesn't exist, just log and continue
        console.warn('Could not create mentor profile:', profileError);
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // CRITICAL: Set httpOnly cookie instead of returning token in body (no cache - everything in DB)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS only)
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiration)
      path: '/',
    };
    
    res.cookie('auth_token', token, cookieOptions);

    // Still return token in body for backward compatibility (frontend will stop using localStorage)
    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as UserRole,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Registration error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginRequest;

    // Check database connection
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        error: 'Database not connected. Please setup PostgreSQL database first.',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined,
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(
      validatedData.password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // CRITICAL: Set httpOnly cookie instead of returning token in body (no cache - everything in DB)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS only)
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiration)
      path: '/',
    };
    
    res.cookie('auth_token', token, cookieOptions);

    // Still return token in body for backward compatibility (frontend will stop using localStorage)
    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as UserRole,
      },
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});

export default router;

