import express from 'express';
import axios from 'axios';
import { Bot } from 'grammy';
import { saveUser, getUserByTelegramId } from '../database/userService';
import { stravaService } from '../strava/strava';

const app = express();
app.use(express.json());

const pendingAuth = new Map<string, number>();

export function startWebhookServer(bot: Bot, port: number = 3001) {
  app.get('/strava/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
      res.send('❌ Código não fornecido. Volte ao Telegram e tente novamente.');
      return;
    }

    let telegramId: number | undefined;
    
    if (state) {
      telegramId = parseInt(state as string);
    } else if (code.toString().startsWith('pending_')) {
      telegramId = pendingAuth.get(code as string);
    }

    if (!telegramId) {
      res.send('❌ Sessão expirada. Volte ao Telegram e tente novamente.');
      return;
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

      const activities = await stravaService.getActivities(30);
      const user = await getUserByTelegramId(telegramId);
      if (user?.id) {
        const { saveActivities } = await import('../database/userService');
        await saveActivities(user.id, activities);
      }

      await bot.api.sendMessage(telegramId, `✅ Strava conectado com sucesso!\n\n👤 ${athlete.firstname} ${athlete.lastname}\n\nUse /start para ver sua saudação!`);

      pendingAuth.delete(code as string);

      res.send('✅ <b>Strava conectado com sucesso!</b><br/>Volte ao Telegram e use /start');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.send('❌ Erro ao conectar Strava. Tente novamente.');
    }
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
