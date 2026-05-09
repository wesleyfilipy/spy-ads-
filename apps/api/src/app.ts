import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adRoutes from './routes/ads';
import favoriteRoutes from './routes/favorites';
import subscriptionRoutes from './routes/subscriptions';
import adminRoutes from './routes/admin';
import miningRoutes from './routes/mining';
import webhookRoutes from './routes/webhooks';

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'chrome-extension://*',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Extension-Token'],
  })
);

// ── Stripe webhook needs raw body ──────────────────────────────
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Rate limiting ──────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mining', miningRoutes);
app.use('/webhooks', webhookRoutes);

// ── Error handlers ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
