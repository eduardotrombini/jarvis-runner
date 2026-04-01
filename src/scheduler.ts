import cron from 'node-cron';
import { Bot, Context } from 'grammy';
import { stravaService } from './strava/strava';
import { logger } from './utils/logger';
import { generateDailyTraining, formatTrainingMessage } from './services/training';
import { getSubscribedUsers } from './database/userService';

export function startScheduler(bot: Bot<Context>) {
  // Every day at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running daily training check for all subscribers...');
    await runDailyCheck(bot);
  });

  logger.info('Scheduler started - daily check at 7:00 AM');
}

async function runDailyCheck(bot: Bot<Context>) {
  try {
    const users = await getSubscribedUsers();
    logger.info(`Checking activities for ${users.length} subscribed users`);

    for (const user of users) {
      if (!user.telegram_id || !user.refresh_token) continue;

      try {
        const activities = await stravaService.getActivities(1, user.refresh_token);
        
        if (activities.length > 0) {
          const run = activities[0];
          await bot.api.sendMessage(
            user.telegram_id, 
            `🎉 Parabéns pelo treino de hoje, ${user.firstname}!\n\n${stravaService.formatActivity(run)}`
          );
        } else {
          const training = generateDailyTraining();
          const message = formatTrainingMessage(training);
          await bot.api.sendMessage(
            user.telegram_id,
            `🌅 Bom dia, ${user.firstname}! Aqui está seu treino planejado para hoje:\n\n${message}`
          );
        }
      } catch (err) {
        logger.error(`Error processing user ${user.telegram_id}:`, err);
      }
    }
  } catch (error) {
    logger.error('Error in daily check scheduler:', error);
  }
}

