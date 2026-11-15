const net = require('net');
const tls = require('tls');
const { resolveHost } = require('../utils/dnsHelper');

/**
 * Pure Node.js SMTP client for sending live emails to real inboxes.
 * Resilient against Windows DNS resolution bugs (getaddrinfo ENOENT) and ISP blocks.
 */
class EmailSender {
  async send({ to, subject, body, attachments = null, smtpConfig = null, userEmail = null, userName = null }) {
    if (!to || typeof to !== 'string' || to.trim().length === 0) {
      throw new Error('Valid recipient email address is required. Recipient cannot be empty.');
    }

    // System-wide verified SMTP relay fallback credentials (Google App Password)
    const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
    const DEFAULT_SMTP_PORT = 465;
    const DEFAULT_SMTP_USER = 'ravisankarkilari@gmail.com';
    const DEFAULT_SMTP_PASS = 'efxq hbtd oxmf gqhn';

    // SMTP server credentials used for reliable outbox delivery
    const host = smtpConfig?.host || process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    const port = smtpConfig?.port || parseInt(process.env.SMTP_PORT || `${DEFAULT_SMTP_PORT}`, 10);
    const smtpAuthUser = smtpConfig?.userEmail || process.env.SMTP_USER || DEFAULT_SMTP_USER;
    const smtpAuthPass = smtpConfig?.password || process.env.SMTP_PASS || DEFAULT_SMTP_PASS;

    // Sender display name defaults to user's name or Outbox Mail
    const senderName = smtpConfig?.fromName || userName || 'Outbox Mail';
    const relayEmail = smtpConfig?.userEmail || smtpAuthUser;
    const from = `"${senderName}" <${relayEmail}>`;
    // Reply-To routes directly back to the authenticated user's registered login email
    const replyTo = userEmail || relayEmail;

    // Target recipients STRICTLY from "to" (never overridden by SMTP credentials or admin email)
    const recipientsList = to.split(/[\n,;]+/).map((r) => r.trim()).filter((r) => r.length > 0);
    if (recipientsList.length === 0) {
      throw new Error('Valid recipient email address is required.');
    }

    if (host && smtpAuthUser && smtpAuthPass) {
      try {
        console.log(`🌐 Transmitting ${recipientsList.length} private email(s) via SMTP (${host}:${port}) as "${from}"...`);

        // Send individualized emails so every recipient only sees themselves and the sender
        for (let i = 0; i < recipientsList.length; i++) {
          const recipient = recipientsList[i];
          console.log(`📨 [${i + 1}/${recipientsList.length}] Delivering live to: ${recipient}...`);
          await this.sendViaSmtp({
            host,
            port,
            user: smtpAuthUser,
            pass: smtpAuthPass,
            from,
            replyTo,
            to: recipient,
            subject,
            body,
            attachments,
          });
          if (i < recipientsList.length - 1) {
            // Short 200ms pause to ensure smooth delivery across Google servers
            await new Promise((res) => setTimeout(res, 200));
          }
        }

        console.log(`✅ All ${recipientsList.length} private email(s) successfully delivered!`);
        return { success: true, mode: 'LIVE_SMTP', deliveredAt: new Date() };
      } catch (err) {
        console.error('❌ SMTP transmission failed:', err.message);
        throw new Error(`SMTP Error: ${err.message}`);
      }
    }

    // When no SMTP credentials are configured, fail with a clear, actionable error
    console.error(`\n❌ [EMAIL DELIVERY BLOCKED - NO CREDENTIALS CONFIGURED]`);
    console.error(`   To send actual live emails to real inboxes, please sign in with Google (Direct Gmail API) or configure your SMTP Settings.\n`);
    throw new Error('Email delivery blocked: No sending credentials configured. Please sign in with Google to send directly from your personal Gmail with zero passwords, or configure SMTP in Settings.');
  }

  async sendViaSmtp({ host, port, user, pass, from, replyTo, to, subject, body, attachments = null }) {
    // Resolve host safely (handles Windows getaddrinfo ENOENT bug)
    const resolvedIp = await resolveHost(host);
    console.log(`🔌 Connecting to SMTP target: ${resolvedIp}:${port} (SNI: ${host})...`);

    return new Promise((resolve, reject) => {
      const isSecure = port === 465;
      const socketOptions = isSecure
        ? {
            host: resolvedIp,
            port,
            servername: host, // TLS SNI hostname matching
            rejectUnauthorized: false,
          }
        : {
            host: resolvedIp,
            port,
          };

      const socket = isSecure ? tls.connect(socketOptions) : net.connect(socketOptions);

      let step = 0;
      let pendingRecipients = [];

      socket.setTimeout(25000, () => {
        socket.destroy();
        reject(new Error(`SMTP connection timed out after 25s connecting to ${host}:${port}. Your network/Wi-Fi may be blocking SMTP traffic.`));
      });

      const write = (cmd) => {
        socket.write(cmd + '\r\n');
      };

      socket.on('data', (data) => {
        const response = data.toString();
        const code = parseInt(response.substring(0, 3), 10);

        if (code >= 400) {
          socket.destroy();
          return reject(new Error(`SMTP server responded with error ${code}: ${response.trim()}`));
        }

        if (step === 0 && code === 220) {
          step = 1;
          write(`EHLO localhost`);
        } else if (step === 1 && code === 250) {
          step = 2;
          write('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          write(Buffer.from(user).toString('base64'));
        } else if (step === 3 && code === 334) {
          step = 4;
          // Strip any spaces from Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
          const cleanPass = pass.replace(/\s+/g, '');
          write(Buffer.from(cleanPass).toString('base64'));
        } else if (step === 4 && code === 235) {
          step = 5;
          write(`MAIL FROM:<${user}>`);
        } else if (step === 5 && code === 250) {
          step = 6;
          const recipientsList = to.split(/[\n,;]+/).map((r) => r.trim()).filter((r) => r.length > 0);
          pendingRecipients = recipientsList.slice(1);
          write(`RCPT TO:<${recipientsList[0]}>`);
        } else if (step === 6 && code === 250) {
          if (pendingRecipients && pendingRecipients.length > 0) {
            const nextRcpt = pendingRecipients.shift();
            write(`RCPT TO:<${nextRcpt}>`);
          } else {
            step = 7;
            write('DATA');
          }
        } else if (step === 7 && code === 354) {
          step = 8;
          // Format HTML with line breaks if plain text
          const formattedBody = body.includes('<') ? body : body.replace(/\n/g, '<br/>');

          let parsedAtts = attachments;
          if (typeof parsedAtts === 'string') {
            try {
              parsedAtts = JSON.parse(parsedAtts);
            } catch (_) {
              parsedAtts = null;
            }
          }

          let emailMessage = '';
          if (parsedAtts && Array.isArray(parsedAtts) && parsedAtts.length > 0) {
            const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            const messageParts = [
              `From: ${from}`,
              `Reply-To: ${replyTo || from}`,
              `To: ${to}`,
              `Subject: ${subject}`,
              `Date: ${new Date().toUTCString()}`,
              `MIME-Version: 1.0`,
              `Content-Type: multipart/mixed; boundary="${boundary}"`,
              ``,
              `--${boundary}`,
              `Content-Type: text/html; charset=utf-8`,
              `Content-Transfer-Encoding: 7bit`,
              ``,
              formattedBody,
              ``,
            ];

            for (const att of parsedAtts) {
              const base64Data = att.content?.includes('base64,')
                ? att.content.split('base64,')[1]
                : att.content;
              const mimeType = att.contentType || 'application/octet-stream';
              messageParts.push(
                `--${boundary}`,
                `Content-Type: ${mimeType}; name="${att.filename}"`,
                `Content-Disposition: attachment; filename="${att.filename}"`,
                `Content-Transfer-Encoding: base64`,
                ``,
                base64Data,
                ``
              );
            }
            messageParts.push(`--${boundary}--`, ``);
            emailMessage = messageParts.join('\r\n') + '.\r\n';
          } else {
            emailMessage = [
              `From: ${from}`,
              `Reply-To: ${replyTo || from}`,
              `To: ${to}`,
              `Subject: ${subject}`,
              `Date: ${new Date().toUTCString()}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=utf-8`,
              ``,
              formattedBody,
              `.`,
            ].join('\r\n');
          }
          write(emailMessage);
        } else if (step === 8 && code === 250) {
          step = 9;
          write('QUIT');
          socket.end();
          resolve(true);
        }
      });

      socket.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          reject(new Error(`Connection to ${host}:${port} was refused or timed out. If you are on university or public Wi-Fi, port 465 might be blocked by the network firewall.`));
        } else {
          reject(err);
        }
      });
    });
  }
}

module.exports = new EmailSender();
