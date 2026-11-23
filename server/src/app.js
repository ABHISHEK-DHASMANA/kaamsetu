import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getDbStatus } from './config/db.js';
import { getDb, flushStorage } from './services/storage.js';

import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import employerRoutes from './routes/employerRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import phonepeRoutes from './routes/phonepeRoutes.js';

dotenv.config();

const app = express();

// Middlewares
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, process.env.CLIENT_URL, ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',')]
    .map(value => String(value || '').trim().replace(/\/+$/, ''))
    .filter(Boolean)
);
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (health checks, server-to-server calls)
    if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) return callback(null, true);
    // are not browser CORS requests and remain allowed.
    return callback(new Error('Origin is not allowed by KaamSetu CORS policy.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = payload => {
    if (!getDbStatus().connected) return sendJson(payload);
    flushStorage()
      .then(() => sendJson(payload))
      .catch(error => {
        console.error('[API] Refusing to acknowledge a write that was not persisted:', error.message);
        if (!res.headersSent) {
          res.status(503);
          sendJson({ success: false, message: 'We could not safely save this change. Please retry in a moment.' });
        }
      });
    return res;
  };
  next();
});


// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const db = getDb();
  res.status(200).json({
    status: 'online',
    platform: 'KAAMSETU Hyperlocal Employment Network',
    version: '1.0.0-production-mvp',
    database: dbStatus,
    stats: {
      totalUsers: db.users?.length || 0,
      totalWorkers: db.workerProfiles?.length || 0,
      totalEmployers: db.employerProfiles?.length || 0,
      totalJobs: db.jobs?.length || 0,
      totalApplications: db.applications?.length || 0
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/phonepe', phonepeRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

export default app;
