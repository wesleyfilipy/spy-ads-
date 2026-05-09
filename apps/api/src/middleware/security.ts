import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// ── Fingerprint + Anti-abuse ───────────────────────────────────

function buildFingerprint(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const ua = req.get('user-agent') ?? '';
  const lang = req.get('accept-language') ?? '';
  return Buffer.from(`${ip}:${ua}:${lang}`).toString('base64').slice(0, 32);
}

export async function antiAbuse(req: Request, res: Response, next: NextFunction) {
  const fp = buildFingerprint(req);
  const key = `abuse:${fp}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, 3600); // 1-hour window
    }

    // 1000 requests/hour per fingerprint
    if (current > 1000) {
      logger.warn(`[Anti-Abuse] Fingerprint ${fp.slice(0, 8)}... exceeded limit (${current})`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests from your session',
        code: 'ABUSE_DETECTED',
      });
    }
  } catch {
    // Redis failure — allow through
  }

  next();
}

// ── Bot detection ──────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /go-http-client/i, /java\//i, /libwww/i,
  /axios\/0\.[0-9]\./i,
];

export function detectBot(req: Request, res: Response, next: NextFunction) {
  const ua = req.get('user-agent') ?? '';
  const isBotUA = BOT_UA_PATTERNS.some((p) => p.test(ua));

  if (isBotUA && !req.headers['x-extension-token']) {
    logger.warn(`[Bot Detection] Blocked UA: ${ua.slice(0, 60)}`);
    return res.status(403).json({ success: false, error: 'Forbidden', code: 'BOT_DETECTED' });
  }

  next();
}

// ── Smart rate limiting (per user, not just IP) ────────────────
export function createUserRateLimit(
  maxRequests: number,
  windowSeconds: number,
  keyPrefix: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.sub ?? req.ip ?? 'anon';
    const key = `ratelimit:${keyPrefix}:${userId}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: ttl,
        });
      }
    } catch {
      // Redis down — allow
    }

    next();
  };
}

// ── IP allowlist for admin ─────────────────────────────────────
const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST ?? '').split(',').filter(Boolean);

export function adminIpGuard(req: Request, res: Response, next: NextFunction) {
  if (ADMIN_IP_WHITELIST.length === 0) return next();

  const ip = req.ip ?? '';
  if (!ADMIN_IP_WHITELIST.includes(ip)) {
    logger.warn(`[Admin Guard] Unauthorized IP: ${ip}`);
    return res.status(403).json({ success: false, error: 'Access denied from this IP' });
  }
  next();
}
