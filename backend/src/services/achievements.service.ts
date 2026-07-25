import { prisma } from '../config/prisma.js';

const ACHIEVEMENT_CODES = {
  FIRST_TASK: 'first_task',
  FIRST_WEEK: 'first_week',
  HUNDRED_TASKS: 'hundred_tasks',
  STREAK_30: 'streak_30',
  FIRST_FRIEND: 'first_friend',
  FIRST_POST: 'first_post',
} as const;

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[keyof typeof ACHIEVEMENT_CODES];

export async function grantAchievement(userId: string, code: AchievementCode) {
  const ach = await prisma.achievement.findUnique({ where: { code } });
  if (!ach) return null;

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: ach.id } },
  });
  if (existing) return null;

  await prisma.userAchievement.create({
    data: { userId, achievementId: ach.id },
  });

  if (ach.xpReward || ach.coinReward) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: ach.xpReward },
        coins: { increment: ach.coinReward },
      },
    });
  }
  await prisma.notification.create({
    data: {
      userId,
      title: `Achievement unlocked: ${ach.title}`,
      body: ach.description ?? `You earned ${ach.xpReward} XP and ${ach.coinReward} coins.`,
    },
  });
  return ach;
}

// Check & grant any achievements that match current user state.
export async function evaluateAchievements(userId: string) {
  const totalLogs = await prisma.taskLog.count({ where: { userId } });
  if (totalLogs >= 1) await grantAchievement(userId, ACHIEVEMENT_CODES.FIRST_TASK);
  if (totalLogs >= 7) await grantAchievement(userId, ACHIEVEMENT_CODES.FIRST_WEEK);
  if (totalLogs >= 100) await grantAchievement(userId, ACHIEVEMENT_CODES.HUNDRED_TASKS);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
  if (user && user.streak >= 30) await grantAchievement(userId, ACHIEVEMENT_CODES.STREAK_30);
}
