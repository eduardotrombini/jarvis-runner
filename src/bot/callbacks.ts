import { Bot, Context } from 'grammy';

export function setupCallbacks(bot: Bot<Context>) {
  bot.callbackQuery('connect_strava', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('🔗 Para conectar seu Strava, clique no link:\nhttps://www.strava.com/oauth/authorize?client_id=SEU_CLIENT_ID&redirect_uri=SEU_REDIRECT_URI&response_type=code&scope=read,activity:read');
  });

  bot.callbackQuery('daily_training', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Aqui está seu treino de hoje:\n\n🏃 Corrida leve - 5km\n⏱️ Pace: 5:30/km\n💓 FC: 140-150 bpm');
  });
}
