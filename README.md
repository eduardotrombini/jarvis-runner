# 🏃 Jarvis Runner

> Seu coach de corrida pessoal com integração Strava + Telegram + IA

## Sobre

Jarvis é um bot de Telegram que monitora seus treinos no Strava, analisa seu desempenho com IA e sugere planos de treino personalizados.

### Funcionalidades

- 📊 Sincronização automática com Strava (OAuth)
- 🤖 Análise de treino com IA
- 📅 Planos de treino personalizados baseados no seu nível
- 💬 Interface via Telegram Bot
- 🔔 Notificações de treino (subscribe/unsubscribe)
- 📈 Estatísticas e resumos (semanal/mensal)
- 🗄️ Persistência com Supabase

## Tech Stack

| Componente | Tecnologia |
|------------|------------|
| Linguagem | TypeScript |
| Bot | Grammy (Telegram) |
| API | Strava v3 |
| Banco de Dados | PostgreSQL + Supabase |
| Servidor | Express (webhook) |
| Infra | Docker + Oracle Cloud |

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env`:

```bash
TELEGRAM_BOT_TOKEN=seu_token_aqui
STRAVA_CLIENT_ID=seu_client_id
STRAVA_CLIENT_SECRET=seu_client_secret
STRAVA_REFRESH_TOKEN=seu_refresh_token
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon
NODE_ENV=development
PORT=3001
CALLBACK_URL=http://localhost:3001  # Para OAuth
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar tabelas no Supabase

Execute o SQL em `src/database/schema.sql` no SQL Editor do Supabase.

### 4. Rodar localmente

```bash
npm run dev
```

## Configuração Strava API

1. Acesse https://www.strava.com/settings/api
2. Preencha:
   - **Application Name**: Jarvis Runner
   - **Authorization Callback Domain**: seu-dominio.com
3. Copie Client ID e Client Secret

## Configuração Telegram Bot

1. Fale com @BotFather no Telegram
2. Crie um novo bot com `/newbot`
3. Copie o token

## Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `/start` | Iniciar o bot |
| `/connectstrava` | Conectar conta Strava (OAuth) |
| `/mytrainings` | Ver últimos treinos |
| `/weekly` | Resumo semanal |
| `/monthly` | Resumo mensal |
| `/analyze` | Análise detalhada com IA |
| `/myplan` | Plano personalizado da semana |
| `/plan` | Treino do dia (genérico) |
| `/subscribe` | Receber treinos diários |
| `/unsubscribe` | Cancelar notificações |
| `/help` | Ver todos os comandos |

## Deploy

### Desenvolvimento (HML)

```bash
docker-compose -f docker-compose.hml.yml up -d
```

### Produção (PRD)

```bash
docker-compose -f docker-compose.prd.yml up -d
```

## Estrutura

```
jarvis-runner/
├── src/
│   ├── bot/              # Comandos e callbacks do Telegram
│   ├── database/         # Supabase client e services
│   ├── server/           # Webhook server (OAuth)
│   ├── services/         # Lógica de treino e análise
│   ├── strava/          # Integração Strava API
│   ├── utils/           # Utilitários
│   └── index.ts         # Entry point
├── .github/workflows/   # CI/CD
├── docker-compose.*.yml  # Deploy configs
└── Dockerfile
```

## Próximos Passos

- [ ] Configurar OAuth com domain definitivo (PRD)
- [ ] Implementar Telegram Bot API webhook (polling → webhook)
- [ ] Adicionar mais métricas de análise (Zona de treinamento)
- [ ] Implementar推送 diária automática de treino
- [ ] Adicionar testes unitários

## Licença

Private © 2026
