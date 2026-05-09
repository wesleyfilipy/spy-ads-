import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many search requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const miningRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many mining submissions' },
  standardHeaders: true,
  legacyHeaders: false,
});
