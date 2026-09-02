require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const usageRoutes = require('./routes/usageRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');
const apiKeyRoutes   = require('./routes/apiKeyRoutes');
const modelRoutes    = require('./routes/modelRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const topicRoutes    = require('./routes/topicRoutes');

const app = express();

// Security headers
app.use(helmet());

// CORS — allow requests from the React client (either Vite port)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// Parse incoming JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General rate limit on all /api routes
app.use('/api', apiLimiter);

// Health check — useful for deployment
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Mount all route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/keys',     apiKeyRoutes);
app.use('/api/models',   modelRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/topics',   topicRoutes);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
});

// Central error handler (must be last)
app.use(errorMiddleware);

module.exports = app;
