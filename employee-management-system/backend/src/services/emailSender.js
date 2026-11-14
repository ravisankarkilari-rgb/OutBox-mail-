const net = require('net');
const tls = require('tls');
const { resolveHost } = require('../utils/dnsHelper');

/**
 * Pure Node.js SMTP client for sending live emails to real inboxes.
 * Resilient against Windows DNS resolution bugs (getaddrinfo ENOENT) and ISP blocks.
 */
class EmailSender {
  async send({ to, subject, body, smtpConfig = null }) {
    // Check if SMTP credentials are provided
    const host = smtpConfig?.host || process.env.SMTP_HOST;
    const port = smtpConfig?.port || parseInt(process.env.SMTP_PORT || '465', 10);
    const user = smtpConfig?.userEmail || process.env.SMTP_USER;
    const pass = smtpConfig?.password || process.env.SMTP_PASS;
    const from = smtpConfig?.fromName
      ? `"${smtpConfig.fromName}" <${user}>`
      : user || 'outbox-mailer@system.local';

    if (host && user && pass) {
      try {
        console.log(`🌐 Transmitting live email via SMTP (${host}:${port}) to: ${to}...`);
        await this.sendViaSmtp({ host, port, user, pass, from, to, subject, body });
        console.log(`✅ Live email delivered via SMTP to ${to}!`);
        return { success: true, mode: 'LIVE_SMTP', deliveredAt: new Date() };
      } catch (err) {
        console.error('❌ SMTP transmission failed:', err.message);
        throw new Error(`SMTP Error: ${err.message}`);
      }
    }

    // Fallback: Simulation Mode when no SMTP credentials have been entered yet
    console.log(`\n⚠️  [SIMULATION MODE - NO SMTP CREDENTIALS ENTERED]`);
    console.log(`   To send actual live emails to inboxes, enter your Gmail address and App Password in "SMTP Settings".`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Delivered At: ${new Date().toISOString()}`);
    console.log(`   Preview: ${body.substring(0, 100)}...\n`);

    return {
      success: true,
      mode: 'SIMULATION',
      note: 'Simulated delivery. Configure your SMTP Settings in the app to send live emails to inboxes.',
      deliveredAt: new Date(),
    };
  }

  async sendViaSmtp({ host, port, user, pass, from, to, subject, body }) {
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

          const emailMessage = [
            `From: ${from}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=utf-8`,
            ``,
            formattedBody,
            `.`,
          ].join('\r\n');
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
