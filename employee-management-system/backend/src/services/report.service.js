const { prisma } = require('../config/database');
const { Parser } = require('json2csv');

class ReportService {
  async getEmployeeReport(query) {
    const { departmentId, status, startDate, endDate } = query;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (startDate || endDate) {
      where.joiningDate = {};
      if (startDate) where.joiningDate.gte = new Date(startDate);
      if (endDate) where.joiningDate.lte = new Date(endDate);
    }

    return prisma.employee.findMany({
      where,
      include: {
        department: true,
        evaluations: { orderBy: { evaluationDate: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCSV(query) {
    const employees = await this.getEmployeeReport(query);
    const data = employees.map((e) => ({
      'Employee ID': e.employeeId,
      'First Name': e.firstName,
      'Last Name': e.lastName,
      Email: e.email,
      Phone: e.phone || '',
      Department: e.department?.name || '',
      Designation: e.designation,
      'Joining Date': e.joiningDate.toISOString().split('T')[0],
      Salary: parseFloat(e.salary),
      Status: e.status,
      'Latest Rating': e.evaluations[0]?.rating || 'N/A',
      'Latest Score': e.evaluations[0]?.score ?? 'N/A',
    }));

    const parser = new Parser();
    return parser.parse(data);
  }

  async getPerformanceReport(query) {
    const { departmentId, rating } = query;
    const empWhere = {};
    if (departmentId) empWhere.departmentId = departmentId;

    const evalWhere = {};
    if (rating) evalWhere.rating = rating;

    return prisma.performanceEvaluation.findMany({
      where: { ...evalWhere, employee: empWhere },
      include: {
        employee: { include: { department: true } },
      },
      orderBy: { evaluationDate: 'desc' },
    });
  }
}

module.exports = new ReportService();

