# Focus Friends — Backend

Express + Prisma + PostgreSQL.

## Setup

```bash
cp ../.env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

API runs on `http://localhost:4000`.

## Scripts

| script              | purpose                            |
|---------------------|------------------------------------|
| `npm run dev`       | Watch mode (tsx)                   |
| `npm run build`     | TypeScript → `dist/`               |
| `npm start`         | Run compiled output                |
| `npm run db:migrate`| Apply Prisma migrations            |
| `npm run db:seed`   | Insert demo data                   |
| `npm run db:studio` | Open Prisma Studio (DB GUI)        |
| `npm test`          | Run vitest                         |

## Folder map

```
src/
├── app.ts          # Express app composition
├── index.ts        # entry — listens
├── config/         # env, prisma
├── middleware/     # auth, error
├── routes/         # one file per resource
├── services/       # xp, streak, achievements
└── utils/          # jwt, password, errors, asyncHandler
```

## Where to extend

- New resource: add a route file under `routes/`, wire it in `app.ts`.
- New XP rule: edit `services/xp.service.ts` and `services/achievements.service.ts`.
- New achievement: add a row in `prisma/seed.ts` (or a migration), grant via `grantAchievement(code)`.
- Real LLM recommendations: replace the heuristic in `routes/recommendations.routes.ts`.
