/**
 * Employee Service Unit Tests
 */

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  },
  connectDB: jest.fn(),
}));

const { prisma } = require('../config/database');
let empService;

beforeAll(() => {
  empService = require('../services/employee.service');
});

afterEach(() => jest.clearAllMocks());

const mockEmployee = {
  id: 'emp-1',
  employeeId: 'EMP0001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@company.com',
  phone: '+1-555-0101',
  designation: 'Software Engineer',
  joiningDate: new Date('2023-01-15'),
  salary: 90000,
  status: 'ACTIVE',
  departmentId: 'dept-1',
  userId: 'user-emp-1',
  department: { id: 'dept-1', name: 'Engineering' },
  createdAt: new Date(),
};

describe('EmployeeService', () => {
  describe('getById()', () => {
    it('should return employee with evaluations and department', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        user: { email: 'john@company.com', role: 'EMPLOYEE', isActive: true },
        evaluations: [],
      });
      const result = await empService.getById('emp-1');
      expect(result.employeeId).toBe('EMP0001');
      expect(result.evaluations).toBeDefined();
    });

    it('should throw 404 for non-existent employee', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(empService.getById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getAll()', () => {
    it('should return paginated employees', async () => {
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employee.count.mockResolvedValue(1);
      const result = await empService.getAll({ page: '1', limit: '10' });
      expect(result.employees).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('create()', () => {
    it('should throw 409 when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(empService.create({
        email: 'john@company.com',
        password: 'Pass@123',
        firstName: 'John',
        lastName: 'Doe',
        designation: 'Engineer',
        departmentId: 'dept-1',
        joiningDate: new Date(),
        salary: 90000,
      })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should create employee via transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(null); // for generateEmployeeId
      const newEmp = { ...mockEmployee, id: 'emp-new' };
      prisma.$transaction.mockImplementation(async (cb) =>
        cb({
          user: { create: jest.fn().mockResolvedValue({ id: 'u-new' }) },
          employee: { create: jest.fn().mockResolvedValue(newEmp) },
        })
      );
      const result = await empService.create({
        email: 'new@company.com',
        password: 'NewPass@123',
        firstName: 'Alice',
        lastName: 'Smith',
        designation: 'Designer',
        departmentId: 'dept-1',
        joiningDate: new Date(),
        salary: 70000,
      });
      expect(result.id).toBe('emp-new');
    });
  });

  describe('update()', () => {
    it('should update employee fields', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({ ...mockEmployee, designation: 'Lead Engineer' });
      const result = await empService.update('emp-1', { designation: 'Lead Engineer' });
      expect(result.designation).toBe('Lead Engineer');
    });

    it('should throw 404 for non-existent employee', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(empService.update('bad-id', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('delete()', () => {
    it('should delete employee and cascade user', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.user.delete.mockResolvedValue({});
      const result = await empService.delete('emp-1');
      expect(result.message).toMatch(/deleted/i);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-emp-1' } });
    });

    it('should throw 404 for non-existent employee', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(empService.delete('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('selfUpdate()', () => {
    it('should allow employee to update phone and address only', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({ ...mockEmployee, phone: '+1-999-9999' });
      const result = await empService.selfUpdate('user-emp-1', { phone: '+1-999-9999', salary: 999999 });
      // salary should be ignored — only phone/address passed to update
      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { phone: '+1-999-9999' } })
      );
    });

    it('should throw 400 if no allowed fields provided', async () => {
      await expect(empService.selfUpdate('user-1', { salary: 999 })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
