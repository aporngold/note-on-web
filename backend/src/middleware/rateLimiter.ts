import rateLimit from 'express-rate-limit';

// Standard rate limit response
const standardRateLimitHandler = (message: string) => {
  return (req: any, res: any) => {
    res.status(429).json({
      error: message,
    });
  };
};

// Skip limiter during development/tests on localhost if needed, or enforce gently
const isLocalhost = (req: any) => {
  const ip = req.ip || req.socket.remoteAddress || '';
  return (
    process.env.NODE_ENV === 'test' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.includes('127.0.0.1')
  );
};

// 1. Rate limiter for User Registration: 10 requests per 1 hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});

// 2. Rate limiter for Login attempts (Brute-Force protection): 10 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});

// 3. Rate limiter for Google Auth / Verification requests: 20 requests per 15 minutes per IP
export const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
