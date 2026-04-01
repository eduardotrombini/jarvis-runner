import axios from 'axios';
import { logger } from '../utils/logger';

const STRAVA_API = 'https://www.strava.com/api/v3';

export interface StravaActivity {
  id: number;
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
}

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

class StravaService {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID || '';
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET || '';
    this.refreshToken = process.env.STRAVA_REFRESH_TOKEN || '';
  }

  async getAccessToken(refreshToken?: string): Promise<string> {
    try {
      const rt = refreshToken || this.refreshToken;
      if (!rt) {
        throw new Error('No refresh token provided');
      }

      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: rt,
        grant_type: 'refresh_token',
      });

      return response.data.access_token;
    } catch (error) {
      logger.error('Error refreshing Strava token:', error);
      throw error;
    }
  }

  async getActivities(daysBack: number = 7, refreshToken?: string): Promise<StravaActivity[]> {
    const accessToken = await this.getAccessToken(refreshToken);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const response = await axios.get(`${STRAVA_API}/athlete/activities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          after: Math.floor(startDate.getTime() / 1000),
          per_page: 100,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching Strava activities:', error);
      throw error;
    }
  }

  async getAthleteStats(athleteId: string, refreshToken?: string) {
    const accessToken = await this.getAccessToken(refreshToken);

    try {
      const response = await axios.get(
        `${STRAVA_API}/athletes/${athleteId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching athlete stats:', error);
      throw error;
    }
  }


  formatActivity(activity: StravaActivity): string {
    const distanceKm = (activity.distance / 1000).toFixed(2);
    const pace = activity.distance > 0 
      ? (activity.moving_time / 60 / (activity.distance / 1000)).toFixed(2)
      : '0.00';
    
    return `🏃 ${activity.name}
📏 ${distanceKm}km | ⏱️ ${Math.floor(activity.moving_time / 60)}min | 🏃‍♂️ ${pace}/km
${activity.average_heartrate ? `💓 ${activity.average_heartrate} bpm` : ''}
📅 ${new Date(activity.start_date).toLocaleDateString('pt-BR')}`;
  }

  formatWeeklySummary(activities: StravaActivity[]): string {
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0) / 1000;
    const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0) / 60;
    const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const runCount = activities.filter(a => a.type === 'Run').length;

    return `📊 *Resumo da Semana*

🏃‍♂️ Corridas: ${runCount}
📏 Distância: ${totalDistance.toFixed(1)} km
⏱️ Tempo: ${Math.floor(totalTime)} min
📈 Elevação: ${totalElevation.toFixed(0)} m`;
  }

  formatMonthlySummary(activities: StravaActivity[]): string {
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0) / 1000;
    const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0) / 60;
    const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const runCount = activities.filter(a => a.type === 'Run').length;

    return `📊 *Resumo do Mês*

🏃‍♂️ Corridas: ${runCount}
📏 Distância: ${totalDistance.toFixed(1)} km
⏱️ Tempo: ${Math.floor(totalTime)} min
📈 Elevação: ${totalElevation.toFixed(0)} m`;
  }
}

export const stravaService = new StravaService();
