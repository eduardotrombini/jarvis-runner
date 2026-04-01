import express from 'express';
import axios from 'axios';
import { Bot } from 'grammy';
import { saveUser, getUserByTelegramId } from '../database/userService';
import { stravaService } from '../strava/strava';

const app = express();
app.use(express.json());

const pendingAuth = new Map<string, number>();

// Core handler for Strava OAuth callback
async function handleStravaCallback(bot: Bot, code: string, state?: string): Promise<string> {
  let telegramId: number | undefined;
  
  if (state) {
    telegramId = parseInt(state);
  } else if (code.startsWith('pending_')) {
    telegramId = pendingAuth.get(code);
  }

  if (!telegramId) {
    return '❌ Sessão expirada ou ID não fornecido. Volte ao Telegram e tente novamente.';
  }

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
    });

    const { athlete, access_token, refresh_token, expires_at } = response.data;

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

    const activities = await stravaService.getActivities(30, refresh_token);
    const user = await getUserByTelegramId(telegramId);
    if (user?.id) {
      const { saveActivities } = await import('../database/userService');
      await saveActivities(user.id, activities);
    }

    const activityCount = activities.length;
    
    await bot.api.sendMessage(telegramId, `✅ Strava conectado com sucesso!\n\n👤 ${athlete.firstname} ${athlete.lastname}\n\n🔄 Buscando seus últimos ${activityCount} treinos...\n\nUse /analyze para ver sua análise!`);

    pendingAuth.delete(code);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="3;url=tg://resolve?domain=Barirunner_treinador_bot&start=connected">
      </head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2>✅ Strava conectado com sucesso!</h2>
        <p>Você receberá uma mensagem no Telegram em alguns segundos...</p>
        <p><a href="tg://resolve?domain=Barirunner_treinador_bot&start=connected">Clique aqui para abrir o Telegram</a></p>
      </body>
      </html>
    `;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return '❌ Erro ao conectar Strava. Tente novamente.';
  }
}

export function startWebhookServer(bot: Bot, port: number = 3001) {
  app.post('/webhook/:token', async (req, res) => {
    try {
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (err) {
      console.error('Error handling update:', err);
      res.sendStatus(500);
    }
  });

  app.get('/', async (req, res) => {
    const { code, state, start } = req.query;

    // Handle Strava callback if code is present
    if (code) {
      const result = await handleStravaCallback(bot, code as string, state as string);
      res.send(result);
      return;
    }

    if (start === 'connected') {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=tg://resolve?domain=Barirunner_treinador_bot">
        </head>
        <body>
          <p>Redirecionando para o Telegram...</p>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=tg://resolve?domain=Barirunner_treinador_bot&start=start">
        </head>
        <body>
          <p>Redirecionando para o Jarvis...</p>
        </body>
        </html>
      `);
    }
  });

  app.get('/strava/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
      res.send('❌ Código não fornecido. Volte ao Telegram e tente novamente.');
      return;
    }

    const result = await handleStravaCallback(bot, code as string, state as string);
    res.send(result);
  });


  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(port, () => {
    console.log(`🌐 Webhook server running on port ${port}`);
  });

  return app;
}

export function setPendingAuth(code: string, telegramId: number) {
  pendingAuth.set(code, telegramId);
  setTimeout(() => pendingAuth.delete(code), 600000);
}
