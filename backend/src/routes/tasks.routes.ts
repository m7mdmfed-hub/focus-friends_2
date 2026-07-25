import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, forbidden } from '../utils/errors.js';
import { awardXp } from '../services/xp.service.js';
import { refreshUserStreak } from '../services/streak.service.js';
import { evaluateAchievements } from '../services/achievements.service.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  points: z.number().int().min(0).max(1000).default(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  repeat: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE']).default('DAILY'),
  visibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PRIVATE'),
  dueAt: z.coerce.date().optional(),
});

const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId, active: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: { logs: { where: { date: { gte: startOfToday() } } } },
    });
    res.json({ tasks });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const task = await prisma.task.create({ data: { ...data, userId: req.userId! } });
    res.status(201).json({ task });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body);
    const task = await prisma.task.findUnique({ where: { id: req.params.id! } });
    if (!task) throw notFound('Task not found');
    if (task.userId !== req.userId) throw forbidden('Not your task');
    const updated = await prisma.task.update({ where: { id: task.id }, data });
    res.json({ task: updated });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id! } });
    if (!task) throw notFound('Task not found');
    if (task.userId !== req.userId) throw forbidden('Not your task');
    await prisma.task.update({ where: { id: task.id }, data: { active: false } });
    res.status(204).end();
  }),
);

router.post(
  '/:id/complete',
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id! } });
    if (!task) throw notFound('Task not found');
    if (task.userId !== req.userId) throw forbidden('Not your task');

    // Idempotent: one log per task per day
    const today = startOfToday();
    await prisma.taskLog.upsert({
      where: { taskId_date: { taskId: task.id, date: today } },
      create: { taskId: task.id, userId: req.userId!, date: today },
      update: { completed: true },
    });

    const { level, leveledUp, xp } = await awardXp(req.userId!, task.points);
    const streak = await refreshUserStreak(req.userId!);
    await evaluateAchievements(req.userId!);

    res.json({ task, awardedXp: task.points, level, leveledUp, xp, streak });
  }),
);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
