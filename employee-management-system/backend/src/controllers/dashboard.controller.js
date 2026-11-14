const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats, 'Dashboard stats fetched');
  } catch (err) { next(err); }
};

module.exports = { getStats };

