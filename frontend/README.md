# Focus Friends — Frontend

React 18 + Vite + TypeScript + Tailwind + React Router + TanStack Query + Zustand.

## Setup

```bash
cp ../.env.example .env
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Scripts

| script          | purpose                  |
|-----------------|--------------------------|
| `npm run dev`   | Vite dev server          |
| `npm run build` | typecheck + production bundle |
| `npm run preview` | preview production build |
| `npm run typecheck` | `tsc --noEmit`        |

## Folder map

```
src/
├── main.tsx         # bootstrap (Query + Router)
├── App.tsx          # routes
├── index.css        # Tailwind + component classes
├── lib/
│   ├── api.ts       # typed fetch client w/ auto-refresh
│   ├── auth.ts      # (used by api)
│   ├── level.ts     # XP curve helpers (mirror of backend)
│   └── utils.ts     # cn, date helpers
├── store/auth.ts    # Zustand auth store (persisted)
├── types/index.ts   # shared TS types matching Prisma
├── components/
│   ├── ui/          # Button, Card, Input, Progress, Avatar
│   └── layout/      # Sidebar, Topbar, Layout
└── pages/           # one file per route
```

## Adding a new page

1. Create `src/pages/MyPage.tsx`.
2. Add a route in `App.tsx`.
3. Add a sidebar entry in `components/layout/Sidebar.tsx`.

## Adding a new API call

Use the typed client:

```ts
import { api } from '@/lib/api';
const res = await api.get<{ tasks: Task[] }>('/tasks');
```
