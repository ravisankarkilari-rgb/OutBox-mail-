const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');

class DepartmentService {
  async getAll() {
    return prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          include: { user: { select: { email: true, isActive: true } } },
          orderBy: { firstName: 'asc' },
        },
        _count: { select: { employees: true } },
      },
    });
    if (!dept) throw new AppError('Department not found', 404);
    return dept;
  }

  async create(data) {
    const existing = await prisma.department.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Department name already exists', 409);
    return prisma.department.create({ data, include: { _count: { select: { employees: true } } } });
  }

  async update(id, data) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw new AppError('Department not found', 404);
    if (data.name && data.name !== dept.name) {
      const dup = await prisma.department.findUnique({ where: { name: data.name } });
      if (dup) throw new AppError('Department name already exists', 409);
    }
    return prisma.department.update({ where: { id }, data, include: { _count: { select: { employees: true } } } });
  }

  async delete(id) {
    const dept = await prisma.department.findUnique({ where: { id }, include: { _count: { select: { employees: true } } } });
    if (!dept) throw new AppError('Department not found', 404);
    if (dept._count.employees > 0) throw new AppError('Cannot delete department with assigned employees', 400);
    await prisma.department.delete({ where: { id } });
    return { message: 'Department deleted successfully' };
  }
}

module.exports = new DepartmentService();

