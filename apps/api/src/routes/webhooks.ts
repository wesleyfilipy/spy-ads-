import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-12-18.acacia',
});

// POST /webhooks/stripe
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('No signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    );
  } catch (err) {
    logger.error('Stripe webhook verification failed:', err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata ?? {};

        if (userId && plan && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);

          await prisma.subscription.update({
            where: { userId },
            data: {
              plan: plan as never,
              status: 'ACTIVE',
              stripeSubscriptionId: sub.id,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });

          await prisma.payment.create({
            data: {
              userId,
              stripePaymentId: session.payment_intent as string,
              amount: session.amount_total ?? 0,
              currency: session.currency ?? 'usd',
              status: 'SUCCEEDED',
              description: `Subscription upgrade to ${plan}`,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status.toUpperCase() as never,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', plan: 'FREE' },
        });
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    logger.error('Error processing Stripe webhook:', err);
    return res.status(500).send('Webhook processing error');
  }

  res.json({ received: true });
});

export default router;
