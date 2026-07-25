import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { conflict, notFound, unauthorized } from '../utils/errors.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
});

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, password } = signupSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw conflict('Email already in use');
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const accessToken = signAccess(user.id);
    const refreshToken = signRefresh(user.id);
    res.status(201).json({ user: publicUser(user), accessToken, refreshToken });
  }),
);

const loginSchema = z.object({ email: z.string().email().toLowerCase(), password: z.string() });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized('Invalid credentials');
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid credentials');
    res.json({
      user: publicUser(user),
      accessToken: signAccess(user.id),
      refreshToken: signRefresh(user.id),
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.body as { refreshToken?: string })?.refreshToken;
    if (!token) throw unauthorized('Missing refresh token');
    const payload = verifyRefresh(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized('User not found');
    res.json({ accessToken: signAccess(user.id), refreshToken: signRefresh(user.id) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw notFound('User not found');
    res.json({ user: publicUser(user) });
  }),
);

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  bio: string | null;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    level: u.level,
    xp: u.xp,
    coins: u.coins,
    streak: u.streak,
    bio: u.bio,
  };
}

export default router;
