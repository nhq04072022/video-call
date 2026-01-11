import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Supabase free tier: max 60 connections, recommend max 5-10 per service
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increase timeout for network issues (10 seconds)
  // Force IPv4 if IPv6 is not available
  ...(process.env.NODE_ENV === 'production' && {
    // Additional options for production
  }),
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  // Don't crash the app on database connection errors
  // Log error but let the app continue running
  console.error('❌ Database connection error:', err.message);
  // Only exit on critical errors, not network issues
  if (err.message.includes('FATAL') || err.message.includes('syntax error')) {
    console.error('❌ Critical database error, exiting...');
    process.exit(-1);
  }
});

export default pool;

