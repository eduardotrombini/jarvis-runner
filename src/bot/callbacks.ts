import { Bot, Context } from 'grammy';

export function setupCallbacks(bot: Bot<Context>) {
  bot.callbackQuery('connect_strava', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const clientId = process.env.STRAVA_CLIENT_ID;
    const callbackUrl = process.env.CALLBACK_URL || 'http://jarvisbot.sytes.net';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&approval_prompt=auto&scope=read,activity:read_all&state=${telegramId}`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`🔗 Para conectar sua conta Strava:\n\n1. Acesse: ${authUrl}\n\n2. Autorize a conexão\n\n⏳ Você receberá uma mensagem quando estiver tudo pronto!`);
  });


  bot.callbackQuery('daily_training', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Aqui está seu treino de hoje:\n\n🏃 Corrida leve - 5km\n⏱️ Pace: 5:30/km\n💓 FC: 140-150 bpm');
  });
}
