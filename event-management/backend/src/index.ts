import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import eventRoutes    from './routes/eventRoutes.js';
import sessionRoutes  from './routes/sessionRoutes.js';
import templateRoutes from './routes/templateRoutes.js';

// ─── Model imports ─────────────────────────────────────────────────────────────
import './models/User.js';
import './models/Organization.js';
import './models/Event.js';
import './models/EventTemplate.js';
import './models/Session.js';
import './models/Tag.js';
import './models/Registration.js';
import './models/Comment.js';

import { seedDefaultTemplates } from './utils/seedTemplates.js';
import { ensureDevBootstrap } from './utils/ensureDevBootstrap.js';

dotenv.config();

const app = express();

// ─── DB ───────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  // Run seeder after DB is ready
  ensureDevBootstrap().catch((e) => console.error('[bootstrap] error:', e));
  seedDefaultTemplates().catch((e) => console.error('[seed] error:', e));
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/events',       eventRoutes);
app.use('/api/sessions',     sessionRoutes);
app.use('/api/templates',    templateRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
