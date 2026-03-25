import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Cabra1q2w3e22w3@db.zqazfcwibuokbvqjrmac.supabase.co:5432/postgres';

const permissions = `
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
`;

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  strava_athlete_id TEXT,
  firstname TEXT,
  lastname TEXT,
  username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  type TEXT,
  distance BIGINT,
  moving_time BIGINT,
  elapsed_time BIGINT,
  total_elevation_gain BIGINT,
  start_date TIMESTAMP WITH TIME ZONE,
  average_speed DOUBLE PRECISION,
  max_speed DOUBLE PRECISION,
  average_heartrate BIGINT,
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
`;

async function main() {
  console.log('Connecting to Supabase...\n');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected!');
    
    await client.query(sql);
    console.log('Tables created successfully!');
    
    await client.query(permissions);
    console.log('Permissions granted!');
    
  } catch (e: any) {
    console.log('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
