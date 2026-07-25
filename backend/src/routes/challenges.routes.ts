import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, conflict } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  goal: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const challenges = await prisma.challenge.findMany({
      orderBy: { startDate: 'desc' },
      take: 50,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true } },
      },
    });
    res.json({ challenges });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    if (data.endDate <= data.startDate) throw conflict('endDate must be after startDate');
    const ch = await prisma.challenge.create({
      data: { ...data, ownerId: req.userId! },
    });
    // Owner joins automatically
    await prisma.challengeMember.create({
      data: { challengeId: ch.id, userId: req.userId! },
    });
    res.status(201).json({ challenge: ch });
  }),
);

router.post(
  '/:id/join',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ch = await prisma.challenge.findUnique({ where: { id: req.params.id! } });
    if (!ch) throw notFound('Challenge not found');
    const member = await prisma.challengeMember.create({
      data: { challengeId: ch.id, userId: req.userId! },
    });
    res.status(201).json({ member });
  }),
);

export default router;
