import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound, badRequest } from '../utils/errors.js';
import { grantAchievement } from '../services/achievements.service.js';
import { broadcastToFriends } from '../services/chat.gateway.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['ACHIEVEMENT', 'STREAK', 'LEVEL_UP', 'CHALLENGE', 'GENERAL']).default('GENERAL'),
  imageUrl: z.string().url().optional(),
});

// Select shape used for both REST responses and WS broadcasts so clients
// can drop the payload straight into their query cache.
const postInclude = {
  user: { select: { id: true, name: true, avatar: true, level: true } },
  reactions: true,
  comments: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
  },
} as const;

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.userId!;
    const friends = await prisma.friend.findMany({
      where: { OR: [{ senderId: me }, { receiverId: me }], status: 'ACCEPTED' },
      select: { senderId: true, receiverId: true },
    });
    const friendIds = new Set<string>([me]);
    for (const f of friends) {
      friendIds.add(f.senderId);
      friendIds.add(f.receiverId);
    }

    const posts = await prisma.post.findMany({
      where: { userId: { in: [...friendIds] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: postInclude,
    });
    res.json({ posts });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const post = await prisma.post.create({
      data: { ...data, userId: req.userId! },
      include: postInclude,
    });
    await grantAchievement(req.userId!, 'first_post');

    // Fire-and-await broadcast to friends + author. Errors are logged but
    // never fail the request — the post is already saved.
    try {
      await broadcastToFriends(req.userId!, { type: 'new_post', post });
    } catch (err) {
      console.warn('⚠️ broadcastToFriends (new_post) failed:', err);
    }

    res.status(201).json({ post });
  }),
);

router.post(
  '/:id/react',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { kind } = z.object({ kind: z.enum(['FIRE', 'CLAP', 'MUSCLE', 'ROCKET', 'HEART']) }).parse(req.body);
    const post = await prisma.post.findUnique({
      where: { id: req.params.id! },
      select: { id: true, userId: true },
    });
    if (!post) throw notFound('Post not found');
    try {
      const reaction = await prisma.reaction.create({
        data: { postId: post.id, userId: req.userId!, kind },
      });
      try {
        await broadcastToFriends(
          post.userId,
          { type: 'new_reaction', postId: post.id, reaction },
        );
      } catch (err) {
        console.warn('⚠️ broadcastToFriends (new_reaction) failed:', err);
      }
      res.status(201).json({ reaction });
    } catch {
      throw badRequest('Already reacted with this kind');
    }
  }),
);

router.post(
  '/:id/comment',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { content } = z.object({ content: z.string().min(1).max(500) }).parse(req.body);
    const post = await prisma.post.findUnique({
      where: { id: req.params.id! },
      select: { id: true, userId: true },
    });
    if (!post) throw notFound('Post not found');
    const comment = await prisma.comment.create({
      data: { postId: post.id, userId: req.userId!, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    try {
      await broadcastToFriends(
        post.userId,
        { type: 'new_comment', postId: post.id, comment },
      );
    } catch (err) {
      console.warn('⚠️ broadcastToFriends (new_comment) failed:', err);
    }
    res.status(201).json({ comment });
  }),
);

export default router;
