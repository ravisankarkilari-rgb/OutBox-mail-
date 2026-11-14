require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const emailRoutes = require('./routes/email.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { frontendUrl } = require('./config/constants');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: 150 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Outbox Mail Scheduler API is live',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
