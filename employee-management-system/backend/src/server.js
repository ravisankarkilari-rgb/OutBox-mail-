require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { port } = require('./config/constants');

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 EMS Server running on http://localhost:${port}`);
    console.log(`📄 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

