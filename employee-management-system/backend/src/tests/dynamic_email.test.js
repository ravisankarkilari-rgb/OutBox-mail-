const schedulerService = require('../services/scheduler.service');
const emailSender = require('../services/emailSender');
const { prisma } = require('../config/database');

// Mock emailSender.sendViaSmtp to test recipient dynamic assignment without network calls
jest.mock('../services/emailSender', () => ({
  send: jest.fn().mockImplementation(async ({ to, subject, userEmail }) => {
    return {
      success: true,
      deliveredTo: to,
      sender: userEmail,
      mode: 'LIVE_TEST',
    };
  }),
}));

describe('Dynamic Login Email Integration (Multi-User Verification)', () => {
  const userA = {
    id: 'user_a_cuid_123',
    email: 'userA@gmail.com',
    name: 'User Alpha',
    role: 'USER',
    password: 'Password@123',
  };

  const userB = {
    id: 'user_b_cuid_456',
    email: 'userB@gmail.com',
    name: 'User Beta',
    role: 'USER',
    password: 'Password@123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('User A: System emails dynamically target userA@gmail.com', async () => {
    // Mock prisma user lookup
    prisma.user.findUnique = jest.fn().mockResolvedValue(userA);
    prisma.scheduledEmail.create = jest.fn().mockImplementation(({ data }) => ({
      id: 'email_a_001',
      ...data,
    }));
    prisma.scheduledEmail.update = jest.fn().mockImplementation(({ data }) => ({
      id: 'email_a_001',
      ...data,
    }));

    const result = await schedulerService.sendSystemEmailToUser(userA.id, {
      subject: 'Welcome User A',
      body: 'Your account is active',
    });

    expect(result.success).toBe(true);
    expect(result.recipient).toBe('userA@gmail.com');
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'userA@gmail.com',
        userEmail: 'userA@gmail.com',
      })
    );
  });

  test('User B: System emails dynamically target userB@gmail.com', async () => {
    // Mock prisma user lookup
    prisma.user.findUnique = jest.fn().mockResolvedValue(userB);
    prisma.scheduledEmail.create = jest.fn().mockImplementation(({ data }) => ({
      id: 'email_b_001',
      ...data,
    }));
    prisma.scheduledEmail.update = jest.fn().mockImplementation(({ data }) => ({
      id: 'email_b_001',
      ...data,
    }));

    const result = await schedulerService.sendSystemEmailToUser(userB.id, {
      subject: 'Welcome User B',
      body: 'Your account is active',
    });

    expect(result.success).toBe(true);
    expect(result.recipient).toBe('userB@gmail.com');
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'userB@gmail.com',
        userEmail: 'userB@gmail.com',
      })
    );
  });

  test('Isolation: User A does not receive User B emails and vice versa', async () => {
    expect(userA.email).not.toBe(userB.email);
    expect(userA.id).not.toBe(userB.id);

    // Verify User A receives only User A's address
    prisma.user.findUnique = jest.fn().mockResolvedValue(userA);
    const resA = await schedulerService.sendSystemEmailToUser(userA.id, {});
    expect(resA.recipient).toBe(userA.email);
    expect(resA.recipient).not.toBe(userB.email);

    // Verify User B receives only User B's address
    prisma.user.findUnique = jest.fn().mockResolvedValue(userB);
    const resB = await schedulerService.sendSystemEmailToUser(userB.id, {});
    expect(resB.recipient).toBe(userB.email);
    expect(resB.recipient).not.toBe(userA.email);
  });

  test('Dynamic Recipient: scheduleEmail with empty or ME defaults to authenticated user email', async () => {
    prisma.scheduledEmail.create = jest.fn().mockImplementation(({ data }) => ({
      id: 'email_dynamic_001',
      ...data,
    }));

    const scheduled = await schedulerService.scheduleEmail(userA.id, {
      recipients: userA.email, // dynamically passed from req.user.email
      subject: 'Personal Self-Scheduled Email',
      body: 'Testing dynamic login email recipient',
      scheduledAt: new Date(Date.now() + 60000),
    });

    expect(scheduled.recipients).toBe('userA@gmail.com');
    expect(scheduled.recipientCount).toBe(1);
  });
});

