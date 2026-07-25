import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, forbidden } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  targetPerWeek: z.number().int().min(1).max(7).default(7),
});

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, active: true },
      include: { logs: { where: { date: { gte: startOfToday() } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ habits });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const habit = await prisma.habit.create({ data: { ...data, userId: req.userId! } });
    res.status(201).json({ habit });
  }),
);

router.post(
  '/:id/checkin',
  asyncHandler(async (req: AuthedRequest, res) => {
    const today = startOfToday();
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id! } });
    if (!habit) throw notFound('Habit not found');
    if (habit.userId !== req.userId) throw forbidden('Not your habit');

    // Skip if already checked in today
    const existing = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: habit.id, date: today } },
    });
    if (existing) {
      res.json({ habit, alreadyCheckedIn: true });
      return;
    }

    // Update streak: if last checkin was yesterday, increment; else reset to 1.
    const yesterday = new Date(today.getTime() - 86_400_000);
    const lastLog = await prisma.habitLog.findFirst({
      where: { habitId: habit.id },
      orderBy: { date: 'desc' },
    });
    const newStreak =
      lastLog && lastLog.date >= yesterday && lastLog.date < today
        ? habit.currentStreak + 1
        : 1;
    const newBest = Math.max(habit.bestStreak, newStreak);

    await prisma.habitLog.create({ data: { habitId: habit.id, userId: req.userId!, date: today } });
    const updated = await prisma.habit.update({
      where: { id: habit.id },
      data: { currentStreak: newStreak, bestStreak: newBest },
    });
    res.json({ habit: updated });
  }),
);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
