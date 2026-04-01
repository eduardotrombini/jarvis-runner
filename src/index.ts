import 'dotenv/config';
import { Bot, Context } from 'grammy';
import { run } from '@grammyjs/runner';
import { setupCommands } from './bot/commands';
import { setupCallbacks } from './bot/callbacks';
import { startScheduler } from './scheduler';
import { logger } from './utils/logger';
import { startWebhookServer } from './server/webhook';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  logger.error('TELEGRAM_BOT_TOKEN is missing!');
  process.exit(1);
}

const bot = new Bot<Context>(botToken);

// Error handling
bot.catch((err) => {
  logger.error('Bot error:', err);
});

// Middleware (order matters - place logging at the top)
bot.use(async (ctx, next) => {
  const from = ctx.from?.id;
  const type = ctx.update.message ? 'message' : (ctx.update.callback_query ? 'callback' : 'other');
  const text = ctx.message?.text || ctx.callbackQuery?.data || '';
  
  logger.info(`Update from ${from} - type: ${type}${text ? ` - content: ${text}` : ''}`);
  await next();
});

// Setup handlers
setupCommands(bot);
setupCallbacks(bot);

async function main() {
  logger.info('Starting Jarvis Runner...');
  
  try {
    await bot.init();
    logger.info(`Bot initialized as @${bot.botInfo.username}`);
    
    // Ensure webhook is removed before starting long polling
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    logger.info('Cleaned up previous webhooks');

    // Start long polling
    run(bot);
    logger.info('Long polling runner started');
    
    // Start webhook server for Strava callbacks
    const port = parseInt(process.env.PORT || '3001');
    startWebhookServer(bot, port);
    
    // Start CRON scheduler
    startScheduler(bot);
    
    logger.info(`Jarvis Runner is fully operational and listening for updates!`);

  } catch (err) {
    logger.error('Initialization failed:', err);
    process.exit(1);
  }
}

main();