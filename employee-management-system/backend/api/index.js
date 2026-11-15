const app = require('../src/app');
const { connectDB } = require('../src/config/database');

let isConnected = false;

// Middleware ensuring DB connection and tables are ready before handling requests
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.warn('DB initialization error:', err.message);
    }
  }
  next();
});

module.exports = app;
