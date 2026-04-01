# Jarvis Runner - Agent Configuration

## Project Commands

### Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
```

### Docker
```bash
docker-compose -f docker-compose.hml.yml up -d    # Homologation
docker-compose -f docker-compose.prd.yml up -d    # Production
```

### Linting
```bash
npm run lint
```

## Environment Variables
- TELEGRAM_BOT_TOKEN
- STRAVA_CLIENT_ID
- STRAVA_CLIENT_SECRET
- STRAVA_REFRESH_TOKEN
- SUPABASE_URL
- SUPABASE_KEY
- CALLBACK_URL
- STRAVA_VERIFY_TOKEN

## Key Files
- src/index.ts - Entry point
- src/bot/commands.ts - Telegram commands
- src/scheduler.ts - Training scheduler
- src/strava/strava.ts - Strava API integration
- src/server/webhook.ts - OAuth and Strava webhooks
