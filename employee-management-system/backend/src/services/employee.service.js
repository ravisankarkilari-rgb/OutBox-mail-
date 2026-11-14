const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { bcryptRounds } = require('../config/constants');

const generateEmployeeId = async () => {
  const last = await prisma.employee.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!last) return 'EMP0001';
  const num = parseInt(last.employeeId.replace('EMP', ''), 10) + 1;
  return `EMP${String(num).padStart(4, '0')}`;
};

class EmployeeService {
  async getAll(query) {
    const { page, limit, skip } = getPagination(query);
    const { search, departmentId, status, designation } = query;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (designation) where.designation = { contains: designation, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit,
        include: { department: true, user: { select: { email: true, role: true, isActive: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);
    return { employees, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { email: true, role: true, isActive: true } },
        evaluations: { orderBy: { evaluationDate: 'desc' } },
      },
    });
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  }

  async getByUserId(userId) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        department: true,
        user: { select: { email: true, role: true, isActive: true } },
        evaluations: { orderBy: { evaluationDate: 'desc' } },
      },
    });
    if (!employee) throw new AppError('Employee profile not found', 404);
    return employee;
  }

  async create(data) {
    const { password, email, ...rest } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('Email already in use', 409);
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    const employeeId = await generateEmployeeId();
    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, password: hashedPassword, role: 'EMPLOYEE' } });
      return tx.employee.create({
        data: { ...rest, email, employeeId, userId: user.id },
        include: { department: true },
      });
    });
    return employee;
  }

  async update(id, data) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new AppError('Employee not found', 404);
    return prisma.employee.update({ where: { id }, data, include: { department: true } });
  }

  async delete(id) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new AppError('Employee not found', 404);
    await prisma.user.delete({ where: { id: employee.userId } });
    return { message: 'Employee deleted successfully' };
  }

  async selfUpdate(userId, data) {
    const allowed = ['phone', 'address'];
    const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(filtered).length) throw new AppError('No updatable fields provided', 400);
    const emp = await prisma.employee.findFirst({ where: { userId } });
    if (!emp) throw new AppError('Employee not found', 404);
    return prisma.employee.update({ where: { id: emp.id }, data: filtered, include: { department: true } });
  }
}

module.exports = new EmployeeService();

