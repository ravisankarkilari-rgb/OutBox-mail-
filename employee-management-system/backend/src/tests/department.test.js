/**
 * Department Service Unit Tests
 */

jest.mock('../config/database', () => ({
  prisma: {
    department: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
let deptService;

beforeAll(() => {
  deptService = require('../services/department.service');
});

afterEach(() => jest.clearAllMocks());

const mockDept = {
  id: 'dept-1',
  name: 'Engineering',
  description: 'Dev team',
  _count: { employees: 0 },
};

describe('DepartmentService', () => {
  describe('getAll()', () => {
    it('should return list of departments', async () => {
      prisma.department.findMany.mockResolvedValue([mockDept]);
      const result = await deptService.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Engineering');
    });
  });

  describe('getById()', () => {
    it('should return department by id', async () => {
      prisma.department.findUnique.mockResolvedValue({ ...mockDept, employees: [] });
      const result = await deptService.getById('dept-1');
      expect(result.name).toBe('Engineering');
    });

    it('should throw 404 for non-existent department', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(deptService.getById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create()', () => {
    it('should create a new department', async () => {
      prisma.department.findUnique.mockResolvedValue(null); // no duplicate
      prisma.department.create.mockResolvedValue(mockDept);
      const result = await deptService.create({ name: 'Engineering', description: 'Dev team' });
      expect(result.name).toBe('Engineering');
    });

    it('should throw 409 for duplicate name', async () => {
      prisma.department.findUnique.mockResolvedValue(mockDept);
      await expect(deptService.create({ name: 'Engineering' })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('update()', () => {
    it('should update department successfully', async () => {
      prisma.department.findUnique
        .mockResolvedValueOnce(mockDept) // for finding department by id
        .mockResolvedValueOnce(null);     // for checking duplicate name
      prisma.department.update.mockResolvedValue({ ...mockDept, name: 'DevOps' });
      const result = await deptService.update('dept-1', { name: 'DevOps' });
      expect(result.name).toBe('DevOps');
    });

    it('should throw 404 for non-existent department', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(deptService.update('bad-id', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('delete()', () => {
    it('should delete department with no employees', async () => {
      prisma.department.findUnique.mockResolvedValue(mockDept); // _count.employees = 0
      prisma.department.delete.mockResolvedValue({});
      const result = await deptService.delete('dept-1');
      expect(result.message).toMatch(/deleted/i);
    });

    it('should throw 400 when department has employees', async () => {
      prisma.department.findUnique.mockResolvedValue({ ...mockDept, _count: { employees: 3 } });
      await expect(deptService.delete('dept-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 for non-existent department', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(deptService.delete('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
