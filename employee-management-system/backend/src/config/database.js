const path = require('path');
const fs = require('fs');

// On Vercel serverless, copy SQLite db to writable /tmp directory
if (process.env.VERCEL) {
  const tmpDb = '/tmp/dev.db';
  const localDb = path.join(__dirname, '../../prisma/dev.db');
  if (!fs.existsSync(tmpDb) && fs.existsSync(localDb)) {
    try {
      fs.copyFileSync(localDb, tmpDb);
    } catch (e) {
      console.warn('Failed to copy SQLite db to /tmp:', e.message);
    }
  }
  process.env.DATABASE_URL = `file:${tmpDb}`;
}

const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ SQLite Outbox Database connected successfully');
  } catch (error) {
    console.warn('\n⚠️  DATABASE WARNING: Could not connect to database');
    console.warn(`   Reason: ${error.message}\n`);
  }
};

module.exports = { prisma, connectDB };
