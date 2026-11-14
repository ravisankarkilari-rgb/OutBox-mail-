const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.warn('\n⚠️  DATABASE WARNING: Could not connect to PostgreSQL at localhost:5432');
    console.warn(`   Reason: ${error.message}`);
    console.warn('   👉 To start PostgreSQL: run "docker compose up -d" in the employee-management-system folder\n');
  }
};

module.exports = { prisma, connectDB };

