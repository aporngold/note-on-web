import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteRoutes';
import notebookRoutes from './routes/notebookRoutes';
import labelRoutes from './routes/labelRoutes';
import boardRoutes from './routes/boardRoutes';
import versionRoutes from './routes/versionRoutes';
import shareRoutes from './routes/shareRoutes';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Trust reverse proxies (Nginx, Caddy, Cloudflare, Vercel) for secure cookies and HTTPS headers
app.set('trust proxy', 1);

const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// Check if SSL certificates are configured for direct HTTPS
const sslKeyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/server.key');
const sslCertPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/server.crt');
const isHttpsEnabled = process.env.ENABLE_HTTPS === 'true' && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

let serverInstance: http.Server | https.Server;

if (isHttpsEnabled) {
  const httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };
  serverInstance = https.createServer(httpsOptions, app);
  console.log('🔒 HTTPS mode enabled with local SSL certificates');
} else {
  serverInstance = http.createServer(app);
}

const io = new Server(serverInstance, {
  cors: {
    origin: (origin, callback) => {
      // Allow both http:// and https:// origins
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === frontendOrigin) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Rate limiting (Exempt localhost/development to avoid throttling during active board editing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Generous limit for real-time collaborative note editing
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit on localhost or during development
    const ip = req.ip || req.socket.remoteAddress || '';
    return (
      process.env.NODE_ENV !== 'production' ||
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.includes('127.0.0.1') ||
      req.hostname === 'localhost'
    );
  },
  message: { error: 'คำขอมากเกินไป กรุณารอสักครู่ (Too many requests, please try again later)' },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === frontendOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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

import uploadRoutes from './routes/uploadRoutes';
import connectionRoutes from './routes/connectionRoutes';

// Static file serving for uploads (images, PDFs, documents)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notes', versionRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/connections', connectionRoutes);

// Track active users in note rooms: noteId -> Map(socketId -> { userId, username })
const notePresenceMap = new Map<string, Map<string, { userId: string; username: string; color?: string }>>();

const PRESENCE_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6'
];

// Socket.io for real-time collaboration / live notes sync
io.on('connection', (socket) => {
  socket.on('join-note', (data: string | { noteId: string; userId?: string; username?: string }) => {
    const noteId = typeof data === 'string' ? data : data.noteId;
    const userId = typeof data === 'object' ? data.userId : undefined;
    const username = typeof data === 'object' ? data.username : undefined;

    socket.join(`note:${noteId}`);

    if (noteId && username) {
      if (!notePresenceMap.has(noteId)) {
        notePresenceMap.set(noteId, new Map());
      }
      const roomUsers = notePresenceMap.get(noteId)!;
      const color = PRESENCE_COLORS[roomUsers.size % PRESENCE_COLORS.length];
      roomUsers.set(socket.id, { userId: userId || socket.id, username, color });

      // Broadcast active user list to room
      const activeList = Array.from(roomUsers.values());
      io.to(`note:${noteId}`).emit('note-presence-updated', activeList);
    }
  });

  socket.on('leave-note', (noteId: string) => {
    socket.leave(`note:${noteId}`);
    if (notePresenceMap.has(noteId)) {
      const roomUsers = notePresenceMap.get(noteId)!;
      roomUsers.delete(socket.id);
      if (roomUsers.size === 0) {
        notePresenceMap.delete(noteId);
      } else {
        io.to(`note:${noteId}`).emit('note-presence-updated', Array.from(roomUsers.values()));
      }
    }
  });

  socket.on('note-cursor', (data: { noteId: string; username: string; color?: string; pos?: number }) => {
    socket.to(`note:${data.noteId}`).emit('remote-note-cursor', data);
  });

  socket.on('note-update', (data: { noteId: string; [key: string]: any }) => {
    socket.to(`note:${data.noteId}`).emit('note-updated', data);
  });

  // Handle disconnect to clean up presence
  socket.on('disconnect', () => {
    notePresenceMap.forEach((roomUsers, noteId) => {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          notePresenceMap.delete(noteId);
        } else {
          io.to(`note:${noteId}`).emit('note-presence-updated', Array.from(roomUsers.values()));
        }
      }
    });
  });

  // Real-time board collaboration
  socket.on('join-board', (boardId: string) => {
    socket.join(`board:${boardId}`);
  });

  socket.on('leave-board', (boardId: string) => {
    socket.leave(`board:${boardId}`);
  });

  socket.on('board-note-moved', (data: { boardId: string; noteId: string; posX: number; posY: number }) => {
    socket.to(`board:${data.boardId}`).emit('remote-note-moved', data);
  });

  socket.on('board-note-updated', (data: { boardId: string; note: any }) => {
    socket.to(`board:${data.boardId}`).emit('remote-note-updated', data);
  });

  socket.on('board-connection-changed', (data: { boardId: string; action: string; connection?: any; id?: string }) => {
    socket.to(`board:${data.boardId}`).emit('remote-connection-changed', data);
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
const protocol = isHttpsEnabled ? 'https' : 'http';

serverInstance.listen(PORT, () => {
  console.log(`🚀 SecureNote API Server running on ${protocol}://localhost:${PORT}`);
  console.log(`📡 Health check: ${protocol}://localhost:${PORT}/health`);
});

export { app, serverInstance, serverInstance as httpServer, io };
