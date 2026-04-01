import { Bot, Context } from 'grammy';
import { stravaService } from '../strava/strava';
import { generateDailyTraining, formatTrainingMessage } from '../services/training';
import { analyzeUserTraining, formatAnalysisMessage, formatWeeklyPlan } from '../services/trainingAnalysis';
import { 
  saveUser, 
  getUserByTelegramId, 
  subscribeUser, 
  unsubscribeUser,
  isUserSubscribed,
  saveActivities,
  createUserOnStart,
  updateUserName,
  getUserCount
} from '../database/userService';
import { setPendingAuth } from '../server/webhook';

const waitingForName = new Set<number>();

export function setupCommands(bot: Bot<Context>) {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const user = await getUserByTelegramId(telegramId);
    
    if (user) {
      if (!user.firstname || user.firstname === 'Corredor') {
        waitingForName.add(telegramId);
        await ctx.reply('Qual é o seu nome?');
      } else {
        let msg = `🏃 Olá, ${user.firstname}! Sou o Jarvis, seu coach de corrida!\n\n`;
        
        if (!user.strava_athlete_id) {
          msg += `⚠️ Você ainda não conectou o Strava!\n\nConecte com /connectstrava para desbloquear todos os recursos!\n\n`;
        }
        
        msg += 'Use /help para ver os comandos.';
        await ctx.reply(msg);
      }
    } else {
      const firstname = ctx.from?.first_name || 'Corredor';
      await createUserOnStart(telegramId, firstname);
      waitingForName.add(telegramId);
      await ctx.reply(`🏃 Olá! Sou o Jarvis, seu coach de corrida!\n\nComo gostaria de ser chamado?`);
    }
  });

  bot.on('message:text', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId || !waitingForName.has(telegramId)) return;
    
    const name = ctx.message.text.trim();
    if (name.length < 2 || name.length > 50) {
      await ctx.reply('Por favor, digite um nome válido (2-50 caracteres).');
      return;
    }
    
    waitingForName.delete(telegramId);
    
    const user = await getUserByTelegramId(telegramId);
    if (user) {
      await updateUserName(telegramId, name);
    } else {
      await createUserOnStart(telegramId, name);
    }
    
    await ctx.reply(`🏃 Prazer, ${name}! Sou o Jarvis, seu coach de corrida!\n\nConecte seu Strava com /connectstrava para desbloquear todos os recursos!\n\nUse /help para ver todos os comandos.`);
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(`📋 Comandos disponíveis:

/start - Iniciar o bot
/connectstrava - Conectar conta Strava
/mytrainings - Ver meus treinos
/weekly - Resumo da semana
/monthly - Resumo do mês
/analyze - Análise dos seus treinos
/myplan - Plano personalizado baseado no seu histórico
/plan - Ver treino do dia
/subscribe - Inscrever-se para receber diários
/unsubscribe - Cancelar notificações`);
  });

  bot.command('mytrainings', async (ctx) => {
    await ctx.reply('🔄 Buscando seus treinos...');
    
    try {
      const activities = await stravaService.getActivities(7);
      
      if (activities.length === 0) {
        await ctx.reply('Nenhum treino encontrado nos últimos 7 dias.');
        return;
      }

      const message = activities
        .slice(0, 5)
        .map(a => stravaService.formatActivity(a))
        .join('\n\n');

      await ctx.reply(message);
    } catch (error) {
      await ctx.reply('❌ Erro ao buscar treinos. Tente /connectstrava primeiro.');
    }
  });

  bot.command('weekly', async (ctx) => {
    await ctx.reply('🔄 Buscando resumo semanal...');
    
    try {
      const activities = await stravaService.getActivities(7);
      const message = stravaService.formatWeeklySummary(activities);
      await ctx.reply(message);
    } catch (error) {
      await ctx.reply('❌ Erro ao buscar dados. Tente /connectstrava primeiro.');
    }
  });

  bot.command('monthly', async (ctx) => {
    await ctx.reply('🔄 Buscando resumo mensal...');
    
    try {
      const activities = await stravaService.getActivities(30);
      const message = stravaService.formatMonthlySummary(activities);
      await ctx.reply(message);
    } catch (error) {
      await ctx.reply('❌ Erro ao buscar dados. Tente /connectstrava primeiro.');
    }
  });

  bot.command('subscribe', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    try {
      await subscribeUser(telegramId);
      await ctx.reply('✅ Você inscrito! Receberá seus treinos diariamente.');
    } catch (error) {
      await ctx.reply('❌ Erro ao inscription. Use /connectstrava primeiro.');
    }
  });

  bot.command('plan', async (ctx) => {
    const training = generateDailyTraining();
    const message = formatTrainingMessage(training);
    await ctx.reply(message);
  });

  bot.command('analyze', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    await ctx.reply('🔄 Analisando seus treinos...');
    
    try {
      const analysis = await analyzeUserTraining(telegramId, 30);
      
      if (!analysis) {
        await ctx.reply('❌ Não há treinos suficientes para análise. Faça algumas atividades no Strava primeiro!');
        return;
      }
      
      const message = formatAnalysisMessage(analysis);
      await ctx.reply(message);
    } catch (error) {
      console.error('Analyze error:', error);
      await ctx.reply('❌ Erro ao analisar. Use /connectstrava primeiro.');
    }
  });

  bot.command('myplan', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    await ctx.reply('🔄 Gerando plano personalizado...');
    
    try {
      const analysis = await analyzeUserTraining(telegramId, 30);
      
      if (!analysis) {
        await ctx.reply('❌ Não há treinos suficientes. Use /plan para ver um treino genérico.');
        return;
      }
      
      const analysisMsg = formatAnalysisMessage(analysis);
      const planMsg = formatWeeklyPlan(analysis.recommendations);
      
      await ctx.reply(analysisMsg + planMsg);
    } catch (error) {
      console.error('Myplan error:', error);
      await ctx.reply('❌ Erro ao gerar plano. Use /connectstrava primeiro.');
    }
  });

  bot.command('unsubscribe', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    try {
      await unsubscribeUser(telegramId);
      await ctx.reply('❌ Você foi descadastrado.');
    } catch (error) {
      await ctx.reply('❌ Erro ao cancelar. Use /connectstrava primeiro.');
    }
  });

  bot.command('connectstrava', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const clientId = process.env.STRAVA_CLIENT_ID;
    const callbackUrl = process.env.CALLBACK_URL || 'http://jarvisbot.sytes.net';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&approval_prompt=auto&scope=read,activity:read_all&state=${telegramId}`;
    
    setPendingAuth(`pending_${telegramId}`, telegramId);
    
    await ctx.reply(`🔗 Para conectar sua conta Strava:\n\n1. Acesse: ${authUrl}\n\n2. Autorize\n\n3. Aguarde - a conexão será automática!\n\n⏳ Você receberá uma mensagem aqui quando conectado.`);
  });

  bot.command('auth', async (ctx) => {
    const code = ctx.message?.text.replace('/auth ', '').trim();
    if (!code) {
      await ctx.reply('Uso: /auth SEU_CODIGO_AQUI\n\nPegue o código da URL do Strava após autorizar.');
      return;
    }

    await ctx.reply('🔄 Trocando código por token...');
    
    try {
      const axios = (await import('axios')).default;
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;
      
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      });

      const { athlete, access_token, refresh_token, expires_at } = response.data;
      
      const telegramId = ctx.from?.id;
      if (telegramId) {
        await saveUser({
          telegram_id: telegramId,
          strava_athlete_id: athlete.id.toString(),
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          username: athlete.username,
          access_token,
          refresh_token,
          expires_at,
        });
        
        const activities = await stravaService.getActivities(30);
        const user = await getUserByTelegramId(telegramId);
        if (user?.id) {
          await saveActivities(user.id, activities);
        }
      }
      
      await ctx.reply(`✅ Strava conectado com sucesso!\n\n👤 ${athlete.firstname} ${athlete.lastname}\n🏃 ${athlete.username}\n\nAgora use /start para ver sua saudação personalizada!`);
    } catch (error: any) {
      console.error('Auth error:', error.response?.data || error.message);
      await ctx.reply('❌ Erro ao conectar Strava. Verifique o código e tente novamente.');
    }
  });

  bot.command('users', async (ctx) => {
    try {
      const count = await getUserCount();
      await ctx.reply(`📊 Total de usuários: ${count}`);
    } catch (error) {
      await ctx.reply('❌ Erro ao buscar usuários.');
    }
  });
}
