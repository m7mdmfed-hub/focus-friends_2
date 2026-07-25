import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { conflict, notFound } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const updateMeSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  bio: z.string().max(280).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
  timezone: z.string().max(60).optional(),
});

router.patch(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateMeSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true, name: true, email: true, avatar: true,
        level: true, xp: true, coins: true, streak: true, bio: true,
      },
    });
    res.json({ user });
  }),
);

router.get(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, email: true, avatar: true,
        level: true, xp: true, coins: true, streak: true, bio: true,
      },
    });
    if (!user) throw notFound('User not found');
    res.json({ user });
  }),
);

router.get(
  '/search',
  asyncHandler(async (req: AuthedRequest, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) {
      res.json({ users: [] });
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.userId } },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, avatar: true, level: true, streak: true },
      take: 20,
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });
    res.json({ users });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, avatar: true,
        level: true, xp: true, streak: true, bio: true, createdAt: true,
      },
    });
    if (!user) throw notFound('User not found');
    res.json({ user });
  }),
);

export default router;
