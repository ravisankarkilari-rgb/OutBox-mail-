require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const emailRoutes = require('./routes/email.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { frontendUrl } = require('./config/constants');
const { connectDB } = require('./config/database');

const app = express();

let isDbReady = false;
let dbInitPromise = null;

// Ensure database connection and tables are ready before any request is handled
app.use(async (req, res, next) => {
  if (!isDbReady) {
    if (!dbInitPromise) {
      dbInitPromise = connectDB()
        .then(() => {
          isDbReady = true;
        })
        .catch((err) => {
          console.error('Database connection error in request middleware:', err);
          dbInitPromise = null;
        });
    }
    await dbInitPromise;
  }
  next();
});

// Security headers (configured to allow Google Auth & fonts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS - Allow frontend dev server, production origins, and all client headers
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-google-access-token', 'X-Google-Access-Token', 'Accept', 'Origin', 'X-Requested-With'],
  })
);
app.options('*', cors());

// Rate limiting: Bypassed in development/testing; generous in production (1,500 req/15 min)
const isDev = process.env.NODE_ENV !== 'production';
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 1500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check (responds on both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true,
    message: 'Outbox Mail Scheduler API is live',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (mounts on both /api/* and direct /* for resilient routing)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/emails', '/emails'], emailRoutes);

// Serve frontend build in production / single-service deployment
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (
      req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/auth') ||
      req.originalUrl.startsWith('/emails') ||
      req.originalUrl.startsWith('/health')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
