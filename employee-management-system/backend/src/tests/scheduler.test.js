/**
 * Scheduler Service Unit Tests
 */

jest.mock('../config/database', () => ({
  prisma: {
    scheduledEmail: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
  connectDB: jest.fn(),
}));

const { prisma } = require('../config/database');
let schedulerService;

beforeAll(() => {
  schedulerService = require('../services/scheduler.service');
});

afterEach(() => jest.clearAllMocks());

const mockEmail = {
  id: 'email-1',
  userId: 'user-1',
  recipients: 'person1@test.com, person2@test.com',
  recipientCount: 2,
  subject: 'Test Scheduled Mail',
  body: 'Hello everyone',
  scheduledAt: new Date(),
  status: 'SCHEDULED',
};

describe('SchedulerService', () => {
  describe('scheduleEmail()', () => {
    it('should schedule an email with multiple recipients', async () => {
      prisma.scheduledEmail.create.mockResolvedValue(mockEmail);

      const result = await schedulerService.scheduleEmail('user-1', {
        recipients: 'person1@test.com, person2@test.com',
        subject: 'Test Scheduled Mail',
        body: 'Hello everyone',
        scheduledAt: new Date().toISOString(),
      });

      expect(result.subject).toBe('Test Scheduled Mail');
      expect(result.recipientCount).toBe(2);
    });

    it('should throw an error if no recipients provided', async () => {
      await expect(
        schedulerService.scheduleEmail('user-1', {
          recipients: '',
          subject: 'No to',
          body: 'text',
          scheduledAt: new Date().toISOString(),
        })
      ).rejects.toThrow('At least one recipient');
    });
  });

  describe('getEmails()', () => {
    it('should return paginated emails for the user', async () => {
      prisma.scheduledEmail.findMany.mockResolvedValue([mockEmail]);
      prisma.scheduledEmail.count.mockResolvedValue(1);

      const result = await schedulerService.getEmails('user-1', { page: 1, limit: 10 });
      expect(result.emails).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('deleteEmail()', () => {
    it('should cancel and delete a scheduled email', async () => {
      prisma.scheduledEmail.findFirst.mockResolvedValue(mockEmail);
      prisma.scheduledEmail.delete.mockResolvedValue(mockEmail);

      const result = await schedulerService.deleteEmail('user-1', 'email-1');
      expect(result.id).toBe('email-1');
    });
  });

  describe('getDashboardStats()', () => {
    it('should return metrics for user outbox', async () => {
      prisma.scheduledEmail.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // scheduled
        .mockResolvedValueOnce(6)  // sent
        .mockResolvedValueOnce(1); // failed
      prisma.scheduledEmail.findMany
        .mockResolvedValueOnce([]) // upcoming
        .mockResolvedValueOnce([]); // recentSent

      const stats = await schedulerService.getDashboardStats('user-1');
      expect(stats.total).toBe(10);
      expect(stats.scheduled).toBe(3);
      expect(stats.sent).toBe(6);
      expect(stats.failed).toBe(1);
    });
  });
});
