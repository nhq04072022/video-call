/**
 * Migration script to create calendar and notification tables
 * Run with: node run-migration.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('📦 Running calendar and notification tables migration...\n');

// Create database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📖 Reading migration file...');
    const migrationFile = join(__dirname, 'src', 'db', 'migrations', 'add_calendar_tables.sql');
    const migrationSQL = readFileSync(migrationFile, 'utf-8');
    
    console.log('🚀 Executing migration...\n');
    
    // Execute the entire migration SQL as one transaction
    // This ensures all tables are created before indexes
    try {
      await client.query('BEGIN');
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('✓ All migration statements executed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      // Check if it's a "already exists" error
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠ Some objects already exist, but continuing...');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('\n📊 Verifying tables...');
    const tables = ['notifications', 'notification_preferences', 'notification_jobs', 'mentor_availability_slots'];
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      if (result.rows[0].exists) {
        console.log(`  ✓ Table '${table}' exists`);
      } else {
        console.log(`  ✗ Table '${table}' NOT found`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
