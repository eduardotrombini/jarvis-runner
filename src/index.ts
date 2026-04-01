import 'dotenv/config';
import { Bot } from 'grammy';
import { run } from '@grammyjs/runner';
import { setupCommands } from './bot/commands';
import { setupCallbacks } from './bot/callbacks';
import { startScheduler } from './scheduler';
import { logger } from './utils/logger';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

bot.catch((err) => {
  logger.error('Bot error:', err);
});

bot.on('message', async (ctx) => {
  logger.info(`Received message from ${ctx.from?.id}: ${ctx.message?.text}`);
});

setupCommands(bot);
setupCallbacks(bot);

bot.use(async (ctx, next) => {
  logger.info(`Update from ${ctx.from?.id} - type: ${ctx.update.message ? 'message' : 'other'}`);
  await next();
});

async function main() {
  logger.info('Starting Jarvis Runner...');
  
  await bot.init();
  logger.info(`Bot initialized as @${bot.botInfo.username}`);
  
  run(bot);
  
  startScheduler();
  
  logger.info(`Jarvis Runner is running with long polling!`);
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});