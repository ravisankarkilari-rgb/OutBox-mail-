const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const getEmployeeReport = async (req, res, next) => {
  try {
    const data = await reportService.getEmployeeReport(req.query);
    return sendSuccess(res, data, 'Employee report generated');
  } catch (err) { next(err); }
};

const exportCSV = async (req, res, next) => {
  try {
    const csv = await reportService.exportCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employee-report.csv"');
    return res.send(csv);
  } catch (err) { next(err); }
};

const getPerformanceReport = async (req, res, next) => {
  try {
    const data = await reportService.getPerformanceReport(req.query);
    return sendSuccess(res, data, 'Performance report generated');
  } catch (err) { next(err); }
};

module.exports = { getEmployeeReport, exportCSV, getPerformanceReport };

