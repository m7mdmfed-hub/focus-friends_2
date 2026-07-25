import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public read — leaderboard is the social hook
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const top = await prisma.user.findMany({
      orderBy: [{ xp: 'desc' }, { streak: 'desc' }],
      take: 50,
      select: { id: true, name: true, avatar: true, level: true, xp: true, streak: true, coins: true },
    });
    res.json({ leaderboard: top });
  }),
);

export default router;
