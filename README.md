# Focus Friends

A web platform for building daily routines and goals through gamification and social accountability.

> Stack: React 18 + Vite + TypeScript + Tailwind · Node.js + Express + TypeScript + Prisma · PostgreSQL

## Repo layout

```
focus-friends/
├── backend/        # Express + Prisma API
├── frontend/       # React + Vite SPA
├── docker-compose.yml
└── .env.example
```

## Quick start

You need: Node 20+, Docker (or a local Postgres 16), npm.

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Backend
cd backend
cp ../.env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev          # → http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp ../.env.example .env
npm install
npm run dev          # → http://localhost:5173
```

Demo logins (after seed):

| email                  | password |
|------------------------|----------|
| alice@focus.app        | password |
| bob@focus.app          | password |

## Core features

- **Tasks** — daily / weekly / monthly / one-time, with points, priority, color, icon, repeat
- **Habits** — custom habits with current/best streak, auto-reset on miss
- **Gamification** — XP, levels, coins, badges, streaks
- **Social** — friends (search + request), activity feed, posts, reactions, challenges, leaderboard
- **Notifications** — task reminders, streak alerts, friend activity
- **AI recommendations** — swappable LLM provider (OpenAI / Anthropic / mock). Falls back to heuristic if no key.
- **Realtime chat** — WebSockets with auto-reconnect and typing indicators
- **Realtime activity feed** — new posts, reactions, and comments pushed to friends over the same WebSocket; the dashboard updates without polling

## API surface

REST, JSON, JWT in `Authorization: Bearer <token>`. WebSocket chat at `/ws?token=…`.

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/search?q=...
GET    /api/users/:id

GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/complete        # awards XP, updates streak

GET    /api/habits
POST   /api/habits
POST   /api/habits/:id/checkin

GET    /api/friends
POST   /api/friends/request
POST   /api/friends/:id/accept
DELETE /api/friends/:id

GET    /api/posts
POST   /api/posts
POST   /api/posts/:id/react

GET    /api/challenges
POST   /api/challenges
POST   /api/challenges/:id/join

GET    /api/achievements
GET    /api/achievements/me

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/messages/:userId
POST   /api/messages/:userId

GET    /api/leaderboard

GET    /api/stats/me
GET    /api/recommendations
```

## Where to start building

1. `backend/prisma/schema.prisma` — the full data model
2. `backend/src/services/xp.service.ts` — level curve and award logic
3. `backend/src/services/chat.gateway.ts` — WebSocket chat server
4. `backend/src/services/llm.provider.ts` — swappable AI provider
5. `frontend/src/pages/Dashboard.tsx` — main entry point after login
6. `frontend/src/lib/ws.ts` — auto-reconnecting chat socket
7. `frontend/src/hooks/useFeedRealtime.ts` — patches React Query cache from WS events

See `backend/README.md` and `frontend/README.md` for module-level docs.

## Tests

```bash
cd backend && npm test
```

16 tests covering XP curve, JWT, password hashing, and the LLM mock provider.
