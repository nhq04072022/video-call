// Migration script to create session_participants table
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: session_participants table...');
    
    // Check if table already exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session_participants'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Table session_participants already exists. Skipping migration.');
      return;
    }
    
    // Create session_participants table
    await client.query(`
      CREATE TABLE session_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
        left_at TIMESTAMP,
        connection_count INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(session_id, user_id, joined_at)
      );
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
    `);
    
    await client.query(`
      CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
    `);
    
    await client.query(`
      CREATE INDEX idx_session_participants_joined_at ON session_participants(joined_at);
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Created table: session_participants');
    console.log('   - Created 3 indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P01') {
      console.error('   Error: Sessions table does not exist. Please run main schema.sql first.');
    } else if (error.code === '42P07') {
      console.log('✅ Table session_participants already exists (detected via duplicate key error).');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
