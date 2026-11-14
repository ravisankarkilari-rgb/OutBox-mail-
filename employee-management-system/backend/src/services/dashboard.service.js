const { prisma } = require('../config/database');

class DashboardService {
  async getStats() {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      totalDepartments,
      recentEmployees,
      departmentStats,
      statusDistribution,
      monthlyJoining,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'INACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.department.count(),
      prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { department: true },
      }),
      prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.employee.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Monthly joining for last 6 months
      prisma.$queryRaw`
        SELECT
          TO_CHAR("joiningDate", 'Mon YYYY') as month,
          DATE_TRUNC('month', "joiningDate") as month_start,
          COUNT(*)::int as count
        FROM employees
        WHERE "joiningDate" >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_start
        ORDER BY month_start ASC
      `,
    ]);

    return {
      summary: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        totalDepartments,
      },
      recentEmployees,
      departmentStats: departmentStats.map((d) => ({
        name: d.name,
        employeeCount: d._count.employees,
      })),
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      monthlyJoining,
    };
  }
}

module.exports = new DashboardService();

