import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { conflict, notFound, badRequest } from '../utils/errors.js';
import { grantAchievement } from '../services/achievements.service.js';

const router = Router();
router.use(requireAuth);

// List my friends + pending requests
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.userId!;
    const [friends, incoming, outgoing] = await Promise.all([
      prisma.friend.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ senderId: me }, { receiverId: me }],
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, level: true, streak: true } },
          receiver: { select: { id: true, name: true, avatar: true, level: true, streak: true } },
        },
      }),
      prisma.friend.findMany({
        where: { receiverId: me, status: 'PENDING' },
        include: { sender: { select: { id: true, name: true, avatar: true, level: true } } },
      }),
      prisma.friend.findMany({
        where: { senderId: me, status: 'PENDING' },
        include: { receiver: { select: { id: true, name: true, avatar: true, level: true } } },
      }),
    ]);
    res.json({ friends, incoming, outgoing });
  }),
);

router.post(
  '/request',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId } = z.object({ userId: z.string().cuid() }).parse(req.body);
    if (userId === req.userId) throw badRequest('Cannot friend yourself');
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw notFound('User not found');

    try {
      const fr = await prisma.friend.create({
        data: { senderId: req.userId!, receiverId: userId, status: 'PENDING' },
      });
      await prisma.notification.create({
        data: { userId, title: 'New friend request', body: `${target.name} wants to be your friend` },
      });
      res.status(201).json({ friend: fr });
    } catch {
      throw conflict('Request already exists');
    }
  }),
);

router.post(
  '/:id/accept',
  asyncHandler(async (req: AuthedRequest, res) => {
    const fr = await prisma.friend.findUnique({ where: { id: req.params.id! } });
    if (!fr) throw notFound('Request not found');
    if (fr.receiverId !== req.userId) throw badRequest('Not your request');
    const updated = await prisma.friend.update({
      where: { id: fr.id },
      data: { status: 'ACCEPTED' },
    });
    await grantAchievement(req.userId!, 'first_friend');
    res.json({ friend: updated });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const fr = await prisma.friend.findUnique({ where: { id: req.params.id! } });
    if (!fr) throw notFound('Request not found');
    if (fr.senderId !== req.userId && fr.receiverId !== req.userId) throw badRequest('Not yours');
    await prisma.friend.delete({ where: { id: fr.id } });
    res.status(204).end();
  }),
);

export default router;
