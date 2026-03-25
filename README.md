# 🏃 Jarvis Runner

> Seu coach de corrida pessoal com integração Strava + Telegram

## Sobre

Jarvis é um bot de Telegram que monitora seus treinos no Strava e envia novos planos de treino automaticamente todos os dias.

### Funcionalidades

- 📊 Sincronização automática com Strava
- 📅 Treinos diários personalizados
- 💬 Interface via Telegram Bot
- 🔔 Notificações de treino
- 📈 Estatísticas e resumos

## Tech Stack

| Componente | Tecnologia |
|------------|-------------|
| Linguagem | TypeScript |
| Bot | Grammy (Telegram) |
| API | Strava v3 |
| Banco de Dados | PostgreSQL + Supabase |
| Infra | Docker + Oracle Cloud |

## Configuração

1. Clone o repositório
2. Copie `.env.example` para `.env` e preencha as variáveis
3. Execute `npm install`
4. Execute `npm run dev` para desenvolvimento

### Variáveis de Ambiente

| Variável | Descrição |
|----------|------------|
| `TELEGRAM_BOT_TOKEN` | Token do Bot Father |
| `STRAVA_CLIENT_ID` | Client ID Strava |
| `STRAVA_CLIENT_SECRET` | Client Secret Strava |
| `STRAVA_REFRESH_TOKEN` | Refresh Token Strava |
| `SUPABASE_URL` | URL do Supabase |
| `SUPABASE_KEY` | Chave do Supabase |

## Deploy

### Desenvolvimento (HML)
```bash
docker-compose -f docker-compose.hml.yml up -d
```

### Produção (PRD)
```bash
docker-compose -f docker-compose.prd.yml up -d
```

## Comandos do Bot

- `/start` - Iniciar o bot
- `/connectstrava` - Conectar conta Strava
- `/mytrainings` - Ver meus treinos
- `/weekly` - Resumo da semana
- `/subscribe` - Receber treinos diários
- `/unsubscribe` - Cancelar notificações

## Estrutura

```
jarvis-runner/
├── src/
│   ├── bot/           # Comandos e callbacks do Telegram
│   ├── services/      # Lógica de treino
│   ├── strava/        # Integração Strava
│   ├── utils/         # Utilitários
│   └── index.ts       # Entry point
├── .github/workflows/ # CI/CD
└── docker-compose.*.yml
```

## Licença

Private © 2026
