require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const foldersRouter = require('./routes/folders');
const messagesRouter = require('./routes/messages');
const chatRouter = require('./routes/chat');
const notesRouter = require('./routes/notes');
const memoryRouter = require('./routes/memory');
const authRouter = require('./routes/auth');
const transcribeRouter = require('./routes/transcribe');
const ttsRouter = require('./routes/tts');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow Vercel frontend and localhost dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Auth middleware (inyecta user_id)
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notes', notesRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/tts', ttsRouter);

// Health check
app.get('/api/health', (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKeyRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (() => { try { return JSON.parse(Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString()).role } catch { return 'parse-error' } })()
    : 'missing';
  res.json({
    status: 'ok',
    service: 'ozone-backend',
    supabaseUrl: supabaseUrl || 'MISSING',
    hasServiceKey,
    serviceKeyRole,
    nodeVersion: process.version,
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🧠 Ozone Backend running on port ${PORT}`);

  // Keep Supabase free-tier project alive (pauses after 7 days of inactivity)
  const { supabase } = require('./config/supabase');
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      await supabase.from('users').select('id').limit(1);
      console.log('[Keep-alive] ping to Supabase OK');
    } catch (err) {
      console.error('[Keep-alive] ping to Supabase failed:', err.message);
    }
  }, TWELVE_HOURS);
});

module.exports = app;
