const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

class EvaluationService {
  async getAll(query) {
    const { page, limit, skip } = getPagination(query);
    const where = query.employeeId ? { employeeId: query.employeeId } : {};
    const [evaluations, total] = await Promise.all([
      prisma.performanceEvaluation.findMany({
        where, skip, take: limit,
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true, designation: true } } },
        orderBy: { evaluationDate: 'desc' },
      }),
      prisma.performanceEvaluation.count({ where }),
    ]);
    return { evaluations, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const ev = await prisma.performanceEvaluation.findUnique({
      where: { id },
      include: { employee: { include: { department: true } } },
    });
    if (!ev) throw new AppError('Evaluation not found', 404);
    return ev;
  }

  async getByEmployeeId(employeeId) {
    return prisma.performanceEvaluation.findMany({ where: { employeeId }, orderBy: { evaluationDate: 'desc' } });
  }

  async create(data) {
    const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw new AppError('Employee not found', 404);
    return prisma.performanceEvaluation.create({
      data,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
    });
  }

  async update(id, data) {
    const ev = await prisma.performanceEvaluation.findUnique({ where: { id } });
    if (!ev) throw new AppError('Evaluation not found', 404);
    return prisma.performanceEvaluation.update({
      where: { id }, data,
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async delete(id) {
    const ev = await prisma.performanceEvaluation.findUnique({ where: { id } });
    if (!ev) throw new AppError('Evaluation not found', 404);
    await prisma.performanceEvaluation.delete({ where: { id } });
    return { message: 'Evaluation deleted successfully' };
  }

  async getStats(employeeId) {
    const evals = await prisma.performanceEvaluation.findMany({ where: { employeeId } });
    if (!evals.length) return { average: 0, total: 0, ratings: {} };
    const avg = evals.reduce((s, e) => s + e.score, 0) / evals.length;
    const ratings = evals.reduce((acc, e) => { acc[e.rating] = (acc[e.rating] || 0) + 1; return acc; }, {});
    return { average: parseFloat(avg.toFixed(2)), total: evals.length, ratings };
  }
}

module.exports = new EvaluationService();

