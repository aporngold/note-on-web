"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.serverInstance = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const notebookRoutes_1 = __importDefault(require("./routes/notebookRoutes"));
const labelRoutes_1 = __importDefault(require("./routes/labelRoutes"));
const boardRoutes_1 = __importDefault(require("./routes/boardRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
// Trust reverse proxies (Nginx, Caddy, Cloudflare, Vercel) for secure cookies and HTTPS headers
app.set('trust proxy', 1);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
// Check if SSL certificates are configured for direct HTTPS
const sslKeyPath = process.env.SSL_KEY_PATH || path_1.default.join(__dirname, '../ssl/server.key');
const sslCertPath = process.env.SSL_CERT_PATH || path_1.default.join(__dirname, '../ssl/server.crt');
const isHttpsEnabled = process.env.ENABLE_HTTPS === 'true' && fs_1.default.existsSync(sslKeyPath) && fs_1.default.existsSync(sslCertPath);
let serverInstance;
if (isHttpsEnabled) {
    const httpsOptions = {
        key: fs_1.default.readFileSync(sslKeyPath),
        cert: fs_1.default.readFileSync(sslCertPath),
    };
    exports.httpServer = exports.serverInstance = serverInstance = https_1.default.createServer(httpsOptions, app);
    console.log('🔒 HTTPS mode enabled with local SSL certificates');
}
else {
    exports.httpServer = exports.serverInstance = serverInstance = http_1.default.createServer(app);
}
const io = new socket_io_1.Server(serverInstance, {
    cors: {
        origin: (origin, callback) => {
            // Allow both http:// and https:// origins
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === frontendOrigin) {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
exports.io = io;
// Rate limiting (Exempt localhost/development to avoid throttling during active board editing)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5000, // Generous limit for real-time collaborative note editing
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limit on localhost or during development
        const ip = req.ip || req.socket.remoteAddress || '';
        return (process.env.NODE_ENV !== 'production' ||
            ip === '127.0.0.1' ||
            ip === '::1' ||
            ip.includes('127.0.0.1') ||
            req.hostname === 'localhost');
    },
    message: { error: 'คำขอมากเกินไป กรุณารอสักครู่ (Too many requests, please try again later)' },
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === frontendOrigin) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive for local dev
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
app.use('/api', limiter);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'SecureNote API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const connectionRoutes_1 = __importDefault(require("./routes/connectionRoutes"));
// Static file serving for uploads (images, PDFs, documents)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/notes', noteRoutes_1.default);
app.use('/api/notebooks', notebookRoutes_1.default);
app.use('/api/labels', labelRoutes_1.default);
app.use('/api/boards', boardRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/connections', connectionRoutes_1.default);
// Socket.io for real-time collaboration / live notes sync
io.on('connection', (socket) => {
    socket.on('join-note', (noteId) => {
        socket.join(`note:${noteId}`);
    });
    socket.on('leave-note', (noteId) => {
        socket.leave(`note:${noteId}`);
    });
    socket.on('note-update', (data) => {
        socket.to(`note:${data.noteId}`).emit('note-updated', data);
    });
    // Real-time board collaboration
    socket.on('join-board', (boardId) => {
        socket.join(`board:${boardId}`);
    });
    socket.on('leave-board', (boardId) => {
        socket.leave(`board:${boardId}`);
    });
    socket.on('board-note-moved', (data) => {
        socket.to(`board:${data.boardId}`).emit('remote-note-moved', data);
    });
    socket.on('board-note-updated', (data) => {
        socket.to(`board:${data.boardId}`).emit('remote-note-updated', data);
    });
    socket.on('board-connection-changed', (data) => {
        socket.to(`board:${data.boardId}`).emit('remote-connection-changed', data);
    });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
const PORT = parseInt(process.env.PORT || '5000', 10);
const protocol = isHttpsEnabled ? 'https' : 'http';
serverInstance.listen(PORT, () => {
    console.log(`🚀 SecureNote API Server running on ${protocol}://localhost:${PORT}`);
    console.log(`📡 Health check: ${protocol}://localhost:${PORT}/health`);
});
