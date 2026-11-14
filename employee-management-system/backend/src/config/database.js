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
