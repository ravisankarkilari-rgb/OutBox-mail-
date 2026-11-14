const schedulerService = require('../services/scheduler.service');
const authService = require('../services/auth.service');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const scheduleEmail = async (req, res, next) => {
  try {
    const { recipients, subject, body, scheduledAt } = req.body;
    if (!recipients || !subject || !body || !scheduledAt) {
      return sendError(res, 'Recipients, subject, message body, and scheduled time are required', 400);
    }

    const email = await schedulerService.scheduleEmail(req.user.id, {
      recipients,
      subject,
      body,
      scheduledAt,
    });

    return sendSuccess(res, email, 'Email scheduled successfully!', 201);
  } catch (err) {
    next(err);
  }
};

const getEmails = async (req, res, next) => {
  try {
    const { emails, pagination } = await schedulerService.getEmails(req.user.id, req.query);
    return sendPaginated(res, emails, pagination, 'Emails fetched');
  } catch (err) {
    next(err);
  }
};

const sendNow = async (req, res, next) => {
  try {
    const email = await schedulerService.sendNow(req.user.id, req.params.id);
    return sendSuccess(res, email, 'Email dispatched immediately');
  } catch (err) {
    next(err);
  }
};

const deleteEmail = async (req, res, next) => {
  try {
    await schedulerService.deleteEmail(req.user.id, req.params.id);
    return sendSuccess(res, null, 'Scheduled email removed');
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await schedulerService.getDashboardStats(req.user.id);
    return sendSuccess(res, stats, 'Outbox stats fetched');
  } catch (err) {
    next(err);
  }
};

const saveSmtp = async (req, res, next) => {
  try {
    const { host, port, userEmail, password, fromName } = req.body;
    if (!host || !userEmail || !password) {
      return sendError(res, 'SMTP Host, Username, and Password are required', 400);
    }
    const config = await authService.saveSmtpConfig(req.user.id, {
      host,
      port: port || 587,
      userEmail,
      password,
      fromName,
    });
    return sendSuccess(res, config, 'SMTP settings saved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scheduleEmail,
  getEmails,
  sendNow,
  deleteEmail,
  getStats,
  saveSmtp,
};

