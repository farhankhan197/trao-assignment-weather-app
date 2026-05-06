import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import cityRoutes from './routes/city.routes';
import weatherRoutes from './routes/weather.routes';
import aiRoutes from './routes/ai.routes';
import { startSnapshotJob } from './utils/snapshotJob';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  startSnapshotJob();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
