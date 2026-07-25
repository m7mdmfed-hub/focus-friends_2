import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, forbidden } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications: notifs });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req: AuthedRequest, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id! } });
    if (!n) throw notFound('Notification not found');
    if (n.userId !== req.userId) throw forbidden('Not yours');
    const updated = await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
    res.json({ notification: updated });
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  }),
);

export default router;
