const { prisma } = require('../config/database');
const emailSender = require('./emailSender');

class SchedulerService {
  constructor() {
    this.intervalId = null;
    this.isProcessing = false;
  }

  start(intervalMs = 15000) {
    if (this.intervalId) return;
    console.log(`⏱️ Outbox Scheduler started (checking every ${intervalMs / 1000}s)`);
    this.intervalId = setInterval(() => this.processPendingEmails(), intervalMs);
    // Initial check immediately on start
    this.processPendingEmails();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processPendingEmails() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      // Find all scheduled emails whose time has arrived
      const pendingEmails = await prisma.scheduledEmail.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
        include: {
          user: {
            include: { smtpConfig: true },
          },
        },
        take: 20, // Process in batches
      });

      if (pendingEmails.length > 0) {
        console.log(`📬 Found ${pendingEmails.length} email(s) ready for dispatch...`);
      }

      for (const item of pendingEmails) {
        await this.dispatchEmail(item);
      }
    } catch (err) {
      console.error('Error processing scheduled emails:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async dispatchEmail(item) {
    try {
      // Mark as sending
      await prisma.scheduledEmail.update({
        where: { id: item.id },
        data: { status: 'SENDING' },
      });

      console.log(`🚀 Dispatching email "${item.subject}" to ${item.recipientCount} recipient(s)...`);

      // Dispatch
      await emailSender.send({
        to: item.recipients,
        subject: item.subject,
        body: item.body,
        smtpConfig: item.user?.smtpConfig,
      });

      // Mark as SENT
      await prisma.scheduledEmail.update({
        where: { id: item.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      console.log(`✅ Email "${item.subject}" successfully delivered!`);
    } catch (err) {
      console.error(`❌ Failed to send email "${item.subject}":`, err.message);
      await prisma.scheduledEmail.update({
        where: { id: item.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
    }
  }

  // Create a new scheduled email (supports single or up to 100+ recipients)
  async scheduleEmail(userId, { recipients, subject, body, scheduledAt }) {
    // Parse recipients (comma-separated, newline-separated or array)
    let emailList = [];
    if (Array.isArray(recipients)) {
      emailList = recipients;
    } else {
      emailList = recipients
        .split(/[\n,;]+/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
    }

    if (emailList.length === 0) {
      throw new Error('At least one recipient email address is required');
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid scheduled date and time');
    }

    return prisma.scheduledEmail.create({
      data: {
        userId,
        recipients: emailList.join(', '),
        recipientCount: emailList.length,
        subject: subject.trim(),
        body: body.trim(),
        scheduledAt: scheduledDate,
        status: 'SCHEDULED',
      },
    });
  }

  // Get user's emails with filtering (SCHEDULED, SENT, FAILED, ALL)
  async getEmails(userId, { status, search, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = { userId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { recipients: { contains: search } },
        { body: { contains: search } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.scheduledEmail.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.scheduledEmail.count({ where }),
    ]);

    return {
      emails,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Cancel or delete a scheduled email
  async deleteEmail(userId, id) {
    const email = await prisma.scheduledEmail.findFirst({ where: { id, userId } });
    if (!email) throw new Error('Email not found');
    return prisma.scheduledEmail.delete({ where: { id } });
  }

  // Send an email immediately right now
  async sendNow(userId, id) {
    const email = await prisma.scheduledEmail.findFirst({
      where: { id, userId },
      include: { user: { include: { smtpConfig: true } } },
    });
    if (!email) throw new Error('Email not found');
    await this.dispatchEmail(email);
    return prisma.scheduledEmail.findUnique({ where: { id } });
  }

  // Summary metrics for user dashboard
  async getDashboardStats(userId) {
    const [total, scheduled, sent, failed] = await Promise.all([
      prisma.scheduledEmail.count({ where: { userId } }),
      prisma.scheduledEmail.count({ where: { userId, status: 'SCHEDULED' } }),
      prisma.scheduledEmail.count({ where: { userId, status: 'SENT' } }),
      prisma.scheduledEmail.count({ where: { userId, status: 'FAILED' } }),
    ]);

    const upcoming = await prisma.scheduledEmail.findMany({
      where: { userId, status: 'SCHEDULED' },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
    });

    const recentSent = await prisma.scheduledEmail.findMany({
      where: { userId, status: 'SENT' },
      take: 5,
      orderBy: { sentAt: 'desc' },
    });

    return {
      total,
      scheduled,
      sent,
      failed,
      upcoming,
      recentSent,
    };
  }
}

module.exports = new SchedulerService();
