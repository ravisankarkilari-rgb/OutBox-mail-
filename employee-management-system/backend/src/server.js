require('dotenv').config();
const dns = require('dns');

// Force IPv4 first to prevent Windows getaddrinfo ENOENT bug
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const app = require('./app');
const { connectDB } = require('./config/database');
const { port } = require('./config/constants');
const schedulerService = require('./services/scheduler.service');

const start = async () => {
  await connectDB();

  // Start background Outbox Scheduler worker (checks every 15s)
  schedulerService.start(15000);

  app.listen(port, () => {
    console.log(`🚀 Outbox Mail Server running on http://localhost:${port}`);
    console.log(`📄 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start Outbox Mail server:', err);
  process.exit(1);
});
