"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordLimiter = exports.resetPasswordLimiter = exports.forgotPasswordLimiter = exports.googleAuthLimiter = exports.loginLimiter = exports.registerLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Standard rate limit response
const standardRateLimitHandler = (message) => {
    return (req, res) => {
        res.status(429).json({
            error: message,
        });
    };
};
// Skip limiter during development/tests on localhost if needed, or enforce gently
const isLocalhost = (req) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    return (process.env.NODE_ENV === 'test' ||
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.includes('127.0.0.1'));
};
// 1. Rate limiter for User Registration: 10 requests per 1 hour per IP
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'development' ? 100 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
// 2. Rate limiter for Login attempts (Brute-Force protection): 10 attempts per 15 minutes per IP
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
// 3. Rate limiter for Google Auth / Verification requests: 20 requests per 15 minutes per IP
exports.googleAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 100 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
// 4. Rate limiter for Forgot Password requests: 5 attempts per 15 minutes per IP
exports.forgotPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 30 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการส่งคำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการส่งคำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
// 5. Rate limiter for Reset Password submissions: 5 attempts per 15 minutes per IP
exports.resetPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 30 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการพยายามตั้งรหัสผ่านใหม่บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการพยายามตั้งรหัสผ่านใหม่บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
// 6. Rate limiter for Change Password (authenticated): 5 attempts per 15 minutes per IP
exports.changePasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 30 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'มีการพยายามเปลี่ยนรหัสผ่านบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    handler: standardRateLimitHandler('มีการพยายามเปลี่ยนรหัสผ่านบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'),
});
