import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const all = await prisma.achievement.findMany({ orderBy: { xpReward: 'asc' } });
    res.json({ achievements: all });
  }),
);

router.get(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const earned = await prisma.userAchievement.findMany({
      where: { userId: req.userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
    res.json({ earned });
  }),
);

export default router;
