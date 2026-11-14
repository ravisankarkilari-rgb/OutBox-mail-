/**
 * Evaluation Service Unit Tests
 */

jest.mock('../config/database', () => ({
  prisma: {
    employee: {
      findUnique: jest.fn(),
    },
    performanceEvaluation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
  connectDB: jest.fn(),
}));

const { prisma } = require('../config/database');
let evalService;

beforeAll(() => {
  evalService = require('../services/evaluation.service');
});

afterEach(() => jest.clearAllMocks());

const mockEvaluation = {
  id: 'eval-1',
  employeeId: 'emp-1',
  evaluationDate: new Date('2024-01-15'),
  rating: 'EXCELLENT',
  score: 95,
  comments: 'Outstanding work',
  goals: 'Scale architecture',
  achievements: 'Shipped v2 ahead of schedule',
  evaluatorName: 'Admin',
};

describe('EvaluationService', () => {
  describe('getAll()', () => {
    it('should return paginated evaluations', async () => {
      prisma.performanceEvaluation.findMany.mockResolvedValue([mockEvaluation]);
      prisma.performanceEvaluation.count.mockResolvedValue(1);

      const result = await evalService.getAll({ page: '1', limit: '10' });
      expect(result.evaluations).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getById()', () => {
    it('should return evaluation by ID', async () => {
      prisma.performanceEvaluation.findUnique.mockResolvedValue(mockEvaluation);
      const result = await evalService.getById('eval-1');
      expect(result.rating).toBe('EXCELLENT');
    });

    it('should throw 404 for invalid evaluation ID', async () => {
      prisma.performanceEvaluation.findUnique.mockResolvedValue(null);
      await expect(evalService.getById('invalid')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create()', () => {
    it('should create an evaluation when employee exists', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.performanceEvaluation.create.mockResolvedValue(mockEvaluation);

      const result = await evalService.create({
        employeeId: 'emp-1',
        evaluationDate: new Date(),
        rating: 'EXCELLENT',
        score: 95,
        evaluatorName: 'Admin',
      });
      expect(result.score).toBe(95);
    });

    it('should throw 404 if employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(
        evalService.create({ employeeId: 'bad-emp', rating: 'GOOD', score: 80, evaluatorName: 'Admin' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getStats()', () => {
    it('should return computed stats for employee', async () => {
      prisma.performanceEvaluation.findMany.mockResolvedValue([
        { score: 90, rating: 'EXCELLENT' },
        { score: 80, rating: 'GOOD' },
      ]);

      const stats = await evalService.getStats('emp-1');
      expect(stats.total).toBe(2);
      expect(stats.average).toBe(85);
      expect(stats.ratings.EXCELLENT).toBe(1);
      expect(stats.ratings.GOOD).toBe(1);
    });

    it('should return zero stats if no evaluations exist', async () => {
      prisma.performanceEvaluation.findMany.mockResolvedValue([]);
      const stats = await evalService.getStats('emp-1');
      expect(stats.total).toBe(0);
      expect(stats.average).toBe(0);
    });
  });
});

