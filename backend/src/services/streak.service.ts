import { prisma } from '../config/prisma.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Update user.streak based on whether they completed anything today / yesterday.
// Called after task/habit completion.
export async function refreshUserStreak(userId: string, today = new Date()) {
  const t = startOfDay(today);
  const yesterday = new Date(t.getTime() - ONE_DAY_MS);

  const completedToday = await prisma.taskLog.count({
    where: { userId, date: { gte: t } },
  });

  const completedYesterday = await prisma.taskLog.count({
    where: { userId, date: { gte: yesterday, lt: t } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
  if (!user) return 0;

  let nextStreak = user.streak;
  if (completedToday > 0) {
    if (completedYesterday > 0 || user.streak === 0) {
      nextStreak = user.streak === 0 ? 1 : user.streak + 1;
    }
  } else if (completedYesterday === 0) {
    nextStreak = 0;
  }

  if (nextStreak !== user.streak) {
    await prisma.user.update({ where: { id: userId }, data: { streak: nextStreak } });
  }
  return nextStreak;
}
