"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../utils/database");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const session = await database_1.prisma.session.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    select: { id: true, email: true, username: true }
                }
            }
        });
        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }
        req.userId = decoded.userId;
        req.sessionId = session.id;
        req.user = session.user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
};
exports.authenticate = authenticate;
