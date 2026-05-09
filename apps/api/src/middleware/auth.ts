import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import type { JWTPayload, UserRole } from '@adspy/types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { subscriptionPlan?: string };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, subscription: { select: { plan: true } } },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'User inactive or not found' });
    }

    req.user = { ...payload, subscriptionPlan: user.subscription?.plan };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

export function requireSubscription(...plans: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const plan = req.user.subscriptionPlan ?? 'FREE';
    if (plans.length > 0 && !plans.includes(plan)) {
      return res.status(403).json({
        success: false,
        error: 'Upgrade your plan to access this feature',
        requiredPlans: plans,
        currentPlan: plan,
      });
    }
    next();
  };
}
