import { Bot } from 'grammy';
import { run } from '@grammyjs/runner';
import { setupCommands } from './bot/commands';
import { setupCallbacks } from './bot/callbacks';
import { startScheduler } from './scheduler';
import { logger } from './utils/logger';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

setupCommands(bot);
setupCallbacks(bot);

bot.use(async (ctx, next) => {
  logger.info(`Update from ${ctx.from?.id}: ${ctx.updateType}`);
  await next();
});

async function main() {
  logger.info('Starting Jarvis Runner...');
  
  await bot.init();
  logger.info(`Bot initialized as @${bot.botInfo.username}`);
  
  run(bot);
  
  startScheduler();
  
  logger.info('Jarvis Runner is running!');
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
