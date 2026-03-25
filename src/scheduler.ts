import cron from 'node-cron';
import { stravaService } from './strava/strava';
import { logger } from './utils/logger';
import { generateDailyTraining } from './services/training';

export function startScheduler() {
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running daily training check...');
    await runDailyCheck();
  });

  logger.info('Scheduler started - daily check at 7:00 AM');
}

async function runDailyCheck() {
  try {
    const activities = await stravaService.getActivities(1);
    
    if (activities.length > 0) {
      logger.info(`Found ${activities.length} activities today`);
    } else {
      logger.info('No activities found today');
      const training = generateDailyTraining();
      logger.info(`Generated training: ${training.type} - ${training.description}`);
    }
  } catch (error) {
    logger.error('Error in daily check:', error);
  }
}
