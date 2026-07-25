import { prisma } from '../config/prisma.js';
import { notFound } from '../utils/errors.js';

// XP curve: 500 * (level^1.5), rounded. Level 1 → 0, Level 2 → 500, Level 3 → 1414, etc.
// Caps runaway progression while staying generous in early levels.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(500 * Math.pow(level - 1, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

// Apply XP gain, recompute level, persist, return {level, leveledUp}.
export async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, xp: true, level: true } });
  if (!user) throw notFound('User not found');
  const newXp = user.xp + amount;
  const newLevel = levelForXp(newXp);
  const leveledUp = newLevel > user.level;
  await prisma.user.update({ where: { id: userId }, data: { xp: newXp, level: newLevel } });
  if (leveledUp) {
    await prisma.notification.create({
      data: {
        userId,
        title: `Level ${newLevel} reached! 🎉`,
        body: `You earned ${amount} XP. Keep going.`,
      },
    });
  }
  return { level: newLevel, leveledUp, xp: newXp };
}
