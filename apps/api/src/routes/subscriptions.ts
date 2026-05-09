import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-12-18.acacia',
});

const PLAN_PRICE_MAP: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC ?? '',
  PRO: process.env.STRIPE_PRICE_PRO ?? '',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

// GET /api/subscriptions/current
router.get('/current', authenticate, async (req: Request, res: Response) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user!.sub },
  });
  res.json({ success: true, data: subscription });
});

// POST /api/subscriptions/checkout
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  const { plan } = req.body;

  if (!PLAN_PRICE_MAP[plan]) throw new AppError(400, 'Invalid plan');

  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { email: true, subscription: { select: { stripeCustomerId: true } } },
  });
  if (!user) throw new AppError(404, 'User not found');

  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await prisma.subscription.update({
      where: { userId: req.user!.sub },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLAN_PRICE_MAP[plan], quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId: req.user!.sub, plan },
  });

  res.json({ success: true, data: { url: session.url } });
});

// POST /api/subscriptions/portal
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user!.sub },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) throw new AppError(400, 'No Stripe customer found');

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
  });

  res.json({ success: true, data: { url: session.url } });
});

export default router;
