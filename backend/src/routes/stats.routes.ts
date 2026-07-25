import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

const ONE_DAY = 86_400_000;

router.get(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.userId!;
    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const start7d = new Date(now.getTime() - 7 * ONE_DAY);
    const start30d = new Date(now.getTime() - 30 * ONE_DAY);

    const [todayLogs, weekLogs, monthLogs, activeTasks, totalTasks, totalHabits, achievements] = await Promise.all([
      prisma.taskLog.count({ where: { userId: me, date: { gte: startToday } } }),
      prisma.taskLog.findMany({ where: { userId: me, date: { gte: start7d } }, select: { date: true, completed: true } }),
      prisma.taskLog.count({ where: { userId: me, date: { gte: start30d } } }),
      prisma.task.count({ where: { userId: me, active: true } }),
      prisma.task.count({ where: { userId: me, active: true } }),
      prisma.habit.count({ where: { userId: me, active: true } }),
      prisma.userAchievement.count({ where: { userId: me } }),
    ]);

    const days7 = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now.getTime() - i * ONE_DAY); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + ONE_DAY);
      return {
        date: dayStart.toISOString().slice(0, 10),
        completed: weekLogs.filter((l) => l.date >= dayStart && l.date < dayEnd).length,
      };
    }).reverse();

    res.json({
      todayCompleted: todayLogs,
      weekCompleted: weekLogs.filter((l) => l.completed).length,
      monthCompleted: monthLogs,
      activeTasks,
      totalTasks,
      totalHabits,
      achievements,
      last7Days: days7,
    });
  }),
);

export default router;
