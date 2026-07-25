import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import habitRoutes from './routes/habits.routes.js';
import friendRoutes from './routes/friends.routes.js';
import postRoutes from './routes/posts.routes.js';
import challengeRoutes from './routes/challenges.routes.js';
import achievementRoutes from './routes/achievements.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import messageRoutes from './routes/messages.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import statsRoutes from './routes/stats.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  const limiter = rateLimit({ windowMs: 60_000, max: 200 });
  app.use('/api/', limiter);

  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/achievements', achievementRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/recommendations', recommendationsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
