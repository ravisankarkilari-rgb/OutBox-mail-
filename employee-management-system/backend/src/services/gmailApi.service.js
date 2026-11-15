const https = require('https');
const { prisma } = require('../config/database');

/**
 * Service to send emails directly via Google's official Gmail REST API.
 * Uses OAuth 2.0 access/refresh tokens.
 * Sends directly from the authenticated user's personal Gmail address with ZERO passwords.
 */
class GmailApiService {
  /**
   * Refreshes an expired Google access token using the stored refresh token.
   */
  async refreshAccessToken(userId, refreshToken) {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/['"]/g, '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').replace(/['"]/g, '').trim();

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in backend/.env to refresh Google OAuth tokens.');
    }

    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString();

      const req = https.request(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', async () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                return reject(new Error(`Google token refresh failed: ${parsed.error_description || parsed.error}`));
              }
              const expiryDate = new Date(Date.now() + (parsed.expires_in || 3600) * 1000);
              await prisma.user.update({
                where: { id: userId },
                data: {
                  googleAccessToken: parsed.access_token,
                  googleTokenExpiry: expiryDate,
                },
              });
              resolve(parsed.access_token);
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Returns a valid access token for the given user, refreshing it if expired.
   */
  async getAccessToken(user) {
    if (!user) return null;
    const now = new Date();

    if (user.googleAccessToken && user.googleTokenExpiry && new Date(user.googleTokenExpiry) > now) {
      return user.googleAccessToken;
    }

    if (user.googleRefreshToken) {
      return this.refreshAccessToken(user.id, user.googleRefreshToken);
    }

    return user.googleAccessToken || null;
  }

  /**
   * Builds an RFC 2822 compliant MIME message and encodes it as URL-safe Base64.
   */
  buildRawMimeMessage({ from, to, subject, body, attachments = null }) {
    const formattedBody = body.includes('<') ? body : body.replace(/\n/g, '<br/>');

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
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

      for (const att of attachments) {
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
      const raw = messageParts.join('\r\n');
      return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const raw = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      formattedBody,
    ].join('\r\n');

    return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Transmits an email directly via the Gmail REST API (users/me/messages/send).
   */
  async sendDirectMessage(accessToken, rawBase64Url) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ raw: rawBase64Url });
      const req = https.request(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                return reject(new Error(`Gmail API error (${parsed.error.code}): ${parsed.error.message}`));
              }
              resolve(parsed);
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Main dispatch method: loops through recipients individually for privacy.
   */
  async send({ user, to, subject, body, attachments = null }) {
    const accessToken = await this.getAccessToken(user);
    if (!accessToken) {
      throw new Error(`User ${user.email} does not have an active Google OAuth access token.`);
    }

    const recipientsList = to.split(/[\n,;]+/).map((r) => r.trim()).filter((r) => r.length > 0);
    if (recipientsList.length === 0) {
      throw new Error('Valid recipient email address is required.');
    }

    const from = user.name ? `"${user.name}" <${user.email}>` : `<${user.email}>`;
    console.log(`🚀 Sending ${recipientsList.length} email(s) directly via Gmail API as "${from}" (ZERO passwords)...`);

    for (let i = 0; i < recipientsList.length; i++) {
      const recipient = recipientsList[i];
      console.log(`📨 [Gmail API] Delivering to: ${recipient}...`);
      const rawBase64 = this.buildRawMimeMessage({
        from,
        to: recipient,
        subject,
        body,
        attachments,
      });

      await this.sendDirectMessage(accessToken, rawBase64);

      if (i < recipientsList.length - 1) {
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    console.log(`✅ All ${recipientsList.length} email(s) successfully delivered via Gmail API!`);
    return { success: true, mode: 'GMAIL_API', deliveredAt: new Date() };
  }
}

module.exports = new GmailApiService();

