import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id?: number;
  telegram_id: number;
  strava_athlete_id: string;
  firstname: string;
  lastname: string;
  username?: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at?: string;
}

export interface Activity {
  id?: number;
  user_id: number;
  strava_activity_id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  start_latitude: number;
  start_longitude: number;
  created_at?: string;
}

export interface Subscription {
  id?: number;
  user_id: number;
  active: boolean;
  created_at?: string;
}
