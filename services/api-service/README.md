# Backend API Service

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup PostgreSQL database:
   - Create database: `video_call_db`
   - Run schema: `psql -U postgres -d video_call_db -f src/db/schema.sql`

3. Configure environment variables in `.env`

4. Run development server:
```bash
npm run dev
```

Server will run on http://localhost:3001

