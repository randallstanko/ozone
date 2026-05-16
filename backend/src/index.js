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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ozone-backend' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🧠 Ozone Backend running on port ${PORT}`);
});

module.exports = app;
