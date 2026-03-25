import { supabase, User, Activity, Subscription } from './supabase';
import { StravaActivity } from '../strava/strava';
import { logger } from '../utils/logger';

export async function saveUser(user: Omit<User, 'id' | 'created_at'>): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      telegram_id: user.telegram_id,
      strava_athlete_id: user.strava_athlete_id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      expires_at: user.expires_at,
    }, { onConflict: 'telegram_id' })
    .select('id')
    .single();

  if (error) {
    logger.error('Error saving user:', error);
    throw error;
  }

  return data.id;
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error getting user:', error);
  }

  return data || null;
}

export async function updateUserToken(telegramId: number, accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    })
    .eq('telegram_id', telegramId);

  if (error) {
    logger.error('Error updating user token:', error);
    throw error;
  }
}

export async function saveActivities(userId: number, activities: StravaActivity[]): Promise<void> {
  const activitiesToInsert = activities.map(a => ({
    user_id: userId,
    strava_activity_id: a.id,
    name: a.name,
    type: a.type,
    distance: a.distance,
    moving_time: a.moving_time,
    elapsed_time: a.elapsed_time,
    total_elevation_gain: a.total_elevation_gain,
    start_date: new Date(a.start_date).toISOString(),
    average_speed: a.average_speed,
    max_speed: a.max_speed,
    average_heartrate: a.average_heartrate || null,
    start_latitude: a.start_latitude,
    start_longitude: a.start_longitude,
  }));

  const { error } = await supabase
    .from('activities')
    .upsert(activitiesToInsert, { onConflict: 'strava_activity_id' });

  if (error) {
    logger.error('Error saving activities:', error);
    throw error;
  }
}

export async function getUserActivities(telegramId: number, daysBack: number = 30): Promise<Activity[]> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_date', startDate.toISOString())
    .order('start_date', { ascending: false });

  if (error) {
    logger.error('Error getting activities:', error);
    return [];
  }

  return data || [];
}

export async function subscribeUser(telegramId: number): Promise<void> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    throw new Error('User not found');
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      active: true,
    }, { onConflict: 'user_id' });

  if (error) {
    logger.error('Error subscribing user:', error);
    throw error;
  }
}

export async function unsubscribeUser(telegramId: number): Promise<void> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const { error } = await supabase
    .from('subscriptions')
    .update({ active: false })
    .eq('user_id', user.id);

  if (error) {
    logger.error('Error unsubscribing user:', error);
    throw error;
  }
}

export async function isUserSubscribed(telegramId: number): Promise<boolean> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return false;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  return !!data;
}
