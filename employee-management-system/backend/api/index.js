const app = require('../src/app');
const { connectDB } = require('../src/config/database');

// Ensure database connection is initialized for serverless invocations
connectDB().catch((err) => console.warn('DB connect error:', err));

module.exports = app;
