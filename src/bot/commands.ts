import { Bot, Context } from 'grammy';

export function setupCommands(bot: Bot<Context>) {
  bot.command('start', async (ctx) => {
    await ctx.reply('🏃 Olá! Sou o Jarvis, seu coach de corrida!\n\nConecte seu Strava com /connectstrava\n\nUse /help para ver todos os comandos.');
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(`📋 Comandos disponíveis:

/start - Iniciar o bot
/connectstrava - Conectar conta Strava
/mytrainings - Ver meus treinos
/weekly - Resumo da semana
/monthly - Resumo do mês
/plan - Ver meu plano de treino
/subscribe - Inscrever-se para receber diários
/unsubscribe - Cancelar notificações`);
  });

  bot.command('mytrainings', async (ctx) => {
    await ctx.reply('Seus treinos aparecerão aqui em breve!');
  });

  bot.command('weekly', async (ctx) => {
    await ctx.reply('Resumo semanal em desenvolvimento...');
  });

  bot.command('subscribe', async (ctx) => {
    await ctx.reply('✅ Você inscrito! Receberá seus treinos diariamente.');
  });

  bot.command('unsubscribe', async (ctx) => {
    await ctx.reply('❌ Você foi descadastrado.');
  });
}
