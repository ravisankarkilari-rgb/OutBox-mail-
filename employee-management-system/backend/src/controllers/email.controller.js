const schedulerService = require('../services/scheduler.service');
const authService = require('../services/auth.service');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const scheduleEmail = async (req, res, next) => {
  try {
    let { recipients, subject, body, scheduledAt, attachments } = req.body;

    // Login Email as Primary Email: If recipients is not specified or set to "ME", dynamically default to the authenticated user's registered email
    if (!recipients || (typeof recipients === 'string' && (recipients.trim() === '' || recipients.trim().toUpperCase() === 'ME'))) {
      recipients = req.user.email;
    }

    if (!subject || !body || !scheduledAt) {
      return sendError(res, 'Subject, message body, and scheduled time are required', 400);
    }

    const email = await schedulerService.scheduleEmail(req.user.id, {
      recipients,
      subject,
      body,
      scheduledAt,
      attachments,
    });

    // If scheduled for <= 2 minutes from now or on serverless (Vercel), dispatch immediately
    const scheduledTime = new Date(scheduledAt).getTime();
    const isImminent = scheduledTime <= Date.now() + 120000;
    if (isImminent || process.env.VERCEL) {
      try {
        const fullItem = await schedulerService.getEmailById(req.user.id, email.id);
        if (fullItem) {
          await schedulerService.dispatchEmail(fullItem);
        }
      } catch (dispErr) {
        console.warn('Immediate dispatch notice:', dispErr.message);
      }
    }

    return sendSuccess(res, email, 'Email scheduled & dispatched successfully!', 201);
  } catch (err) {
    next(err);
  }
};

const sendSystemEmail = async (req, res, next) => {
  try {
    const { subject, body, attachments } = req.body;

    // Dynamic Recipient: Always dynamically send to the authenticated user's registered login email address
    const result = await schedulerService.sendSystemEmailToUser(req.user.id, {
      subject: subject || 'Outbox Mail System Alert',
      body: body || `<p>Hello ${req.user.name || req.user.email},</p><p>This email was dynamically sent to your verified registered login email address (<strong>${req.user.email}</strong>).</p>`,
      attachments,
    });

    return sendSuccess(res, result, `Email dynamically dispatched to your login address (${req.user.email})`);
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
  sendSystemEmail,
  getEmails,
  sendNow,
  deleteEmail,
  getStats,
  saveSmtp,
};

