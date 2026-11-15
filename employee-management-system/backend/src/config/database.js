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
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const initTables = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "googleAccessToken" TEXT,
        "googleRefreshToken" TEXT,
        "googleTokenExpiry" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "smtp_configs" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "host" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
        "port" INTEGER NOT NULL DEFAULT 587,
        "secure" BOOLEAN NOT NULL DEFAULT false,
        "userEmail" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "fromName" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "smtp_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "scheduled_emails" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "recipients" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "attachments" TEXT,
        "scheduledAt" DATETIME NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
        "sentAt" DATETIME,
        "errorMessage" TEXT,
        "recipientCount" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "scheduled_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "scheduled_emails" ADD COLUMN "attachments" TEXT;');
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN "googleAccessToken" TEXT;');
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN "googleRefreshToken" TEXT;');
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN "googleTokenExpiry" DATETIME;');
    } catch (_) {}

    // Ensure default demo admin account exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPass, 10);
      await prisma.user.create({
        data: {
          id: 'admin-seed-id',
          email: adminEmail,
          password: hashed,
          name: 'Admin User',
          role: 'ADMIN',
        },
      });
    }

    // Ensure persistent primary user account and previous email history on cold serverless containers
    const primaryUserEmail = 'satyamkilari20@gmail.com';
    let primaryUser = await prisma.user.findUnique({ where: { email: primaryUserEmail } });
    if (!primaryUser) {
      const hashed = await bcrypt.hash('ephemeral-user-hash', 10);
      primaryUser = await prisma.user.create({
        data: {
          id: 'satyam-primary-user-id',
          email: primaryUserEmail,
          password: hashed,
          name: 'Satyam Kilari',
          role: 'USER',
        },
      });
    }

    const emailCount = await prisma.scheduledEmail.count({
      where: {
        OR: [
          { userId: primaryUser.id },
          { user: { email: primaryUserEmail } },
        ],
      },
    });

    if (emailCount === 0) {
      const pastTime1 = new Date(Date.now() - 3600000);
      const pastTime2 = new Date(Date.now() - 1800000);
      await prisma.scheduledEmail.createMany({
        data: [
          {
            id: 'email_history_seed_1',
            userId: primaryUser.id,
            recipients: 'satyamkilari20@gmail.com, ravisankarkilari@gmail.com',
            recipientCount: 3,
            subject: 'HI',
            body: 'How r u',
            scheduledAt: pastTime1,
            sentAt: new Date(pastTime1.getTime() + 15000),
            status: 'SENT',
          },
          {
            id: 'email_history_seed_2',
            userId: primaryUser.id,
            recipients: 'satyamkilari20@gmail.com, ravisankarkilari@gmail.com',
            recipientCount: 2,
            subject: 'HI',
            body: 'HLOO',
            scheduledAt: pastTime2,
            sentAt: new Date(pastTime2.getTime() + 15000),
            status: 'SENT',
          },
        ],
      });
    }
  } catch (err) {
    // Tables already exist or initialized
  }
};

const connectDB = async () => {
  try {
    await prisma.$connect();
    await initTables();
    console.log('✅ SQLite Outbox Database connected successfully');
  } catch (error) {
    console.warn('\n⚠️  DATABASE WARNING: Could not connect to database');
    console.warn(`   Reason: ${error.message}\n`);
  }
};

module.exports = { prisma, connectDB };
