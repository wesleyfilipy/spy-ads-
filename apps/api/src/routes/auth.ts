import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '@adspy/utils';
import { createTokenPair, verifyRefreshToken } from '../lib/jwt';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { UserRole } from '@adspy/types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// POST /api/auth/register
router.post('/register', authRateLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already in use');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      subscription: {
        create: {
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const tokens = createTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(201).json({ success: true, data: { user, tokens } });
});

// POST /api/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      passwordHash: true,
      avatarUrl: true,
    },
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'Account suspended');
  }

  const tokens = createTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { passwordHash: _, ...safeUser } = user;

  res.json({ success: true, data: { user: safeUser, tokens } });
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true, role: true, status: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token expired or revoked');
  }

  if (stored.user.status !== 'ACTIVE') {
    throw new AppError(403, 'Account suspended');
  }

  // Rotate refresh token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = createTokenPair({
    id: stored.user.id,
    email: stored.user.email,
    role: stored.user.role as UserRole,
  });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: stored.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ success: true, data: { tokens } });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId: req.user!.sub },
      data: { revokedAt: new Date() },
    });
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      avatarUrl: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!user) throw new AppError(404, 'User not found');

  res.json({ success: true, data: user });
});

export default router;
