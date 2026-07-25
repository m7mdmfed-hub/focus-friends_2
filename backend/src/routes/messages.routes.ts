import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/:userId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.userId!;
    const other = req.params.userId!;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: other },
          { senderId: other, receiverId: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    res.json({ messages });
  }),
);

router.post(
  '/:userId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
    const other = await prisma.user.findUnique({ where: { id: req.params.userId! } });
    if (!other) throw notFound('Recipient not found');
    const message = await prisma.message.create({
      data: { senderId: req.userId!, receiverId: req.params.userId!, content },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    await prisma.notification.create({
      data: { userId: req.params.userId!, title: 'New message', body: content.slice(0, 80) },
    });
    res.status(201).json({ message });
  }),
);

export default router;
