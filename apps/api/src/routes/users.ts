import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '@adspy/utils';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

// GET /api/users/profile
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      dailySearches: true,
      subscription: true,
      _count: { select: { favorites: true, searchHistory: true } },
    },
  });

  if (!user) throw new AppError(404, 'User not found');

  res.json({ success: true, data: user });
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, validate(updateProfileSchema), async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: req.body,
    select: { id: true, email: true, name: true, avatarUrl: true, updatedAt: true },
  });

  res.json({ success: true, data: user });
});

// POST /api/users/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { passwordHash: true },
  });

  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: req.user!.sub },
    data: { revokedAt: new Date() },
  });

  res.json({ success: true, message: 'Password changed successfully' });
});

// GET /api/users/search-history
router.get('/search-history', authenticate, async (req: Request, res: Response) => {
  const history = await prisma.searchHistory.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: history });
});

// DELETE /api/users/search-history
router.delete('/search-history', authenticate, async (req: Request, res: Response) => {
  await prisma.searchHistory.deleteMany({ where: { userId: req.user!.sub } });
  res.json({ success: true, message: 'Search history cleared' });
});

export default router;
