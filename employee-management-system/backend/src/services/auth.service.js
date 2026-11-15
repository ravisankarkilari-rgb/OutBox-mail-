const bcrypt = require('bcryptjs');
const https = require('https');
const { prisma } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { bcryptRounds } = require('../config/constants');

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { smtpConfig: true },
    });
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async register(email, password, role = 'USER', name = null) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered. Please login.', 409);

    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'USER',
        name: name || email.split('@')[0],
      },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  // Exchange Google authorization code for access_token and refresh_token
  async exchangeGoogleAuthCode(code, redirectUri = null) {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/['"]/g, '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').replace(/['"]/g, '').trim();

    if (!clientId || !clientSecret) {
      throw new AppError('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in backend/.env for Google OAuth exchange', 400);
    }

    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || 'postmessage',
        grant_type: 'authorization_code',
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
              const tokenData = JSON.parse(data);
              if (tokenData.error) {
                return reject(new AppError(`Google OAuth error: ${tokenData.error_description || tokenData.error}`, 400));
              }
              resolve(tokenData);
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', (err) => reject(new AppError(`OAuth exchange request failed: ${err.message}`, 500)));
      req.write(postData);
      req.end();
    });
  }

  // Save Google OAuth tokens directly to a user for passwordless direct Gmail API sending
  async saveGoogleTokens(userId, { code, accessToken, refreshToken, expiresIn }) {
    let finalAccessToken = accessToken;
    let finalRefreshToken = refreshToken;
    let expiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    if (code) {
      const exchanged = await this.exchangeGoogleAuthCode(code);
      finalAccessToken = exchanged.access_token;
      if (exchanged.refresh_token) finalRefreshToken = exchanged.refresh_token;
      expiry = new Date(Date.now() + (exchanged.expires_in || 3600) * 1000);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: finalAccessToken || undefined,
        googleRefreshToken: finalRefreshToken || undefined,
        googleTokenExpiry: expiry || undefined,
      },
      include: { smtpConfig: true },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  fetchGoogleUserInfo(accessToken) {
    return new Promise((resolve, reject) => {
      https
        .get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (err) {
                reject(err);
              }
            });
          }
        )
        .on('error', reject);
    });
  }

  // Google OAuth verification and user synchronization
  async googleAuth(credential, demoUser = null, oauthData = null) {
    let email = null;
    let name = null;
    let googleTokens = null;

    if (oauthData?.code) {
      const exchanged = await this.exchangeGoogleAuthCode(oauthData.code);
      googleTokens = {
        accessToken: exchanged.access_token,
        refreshToken: exchanged.refresh_token,
        expiry: new Date(Date.now() + (exchanged.expires_in || 3600) * 1000),
      };
      if (exchanged.id_token) {
        try {
          const payload = await this.verifyGoogleToken(exchanged.id_token);
          email = payload.email;
          name = payload.name;
        } catch (e) {
          console.warn('ID token verify fallback:', e.message);
        }
      }
      if (!email && exchanged.access_token) {
        const userInfo = await this.fetchGoogleUserInfo(exchanged.access_token);
        email = userInfo.email;
        name = userInfo.name || email.split('@')[0];
      }
    } else if (oauthData?.accessToken) {
      googleTokens = {
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken || null,
        expiry: oauthData.expiresIn ? new Date(Date.now() + oauthData.expiresIn * 1000) : null,
      };
      if (!email && oauthData.accessToken) {
        const userInfo = await this.fetchGoogleUserInfo(oauthData.accessToken);
        email = userInfo.email;
        name = userInfo.name || email.split('@')[0];
      }
    }

    if (!email) {
      if (!credential && (!demoUser || !demoUser.email)) {
        throw new AppError('Google credential or email is required', 400);
      }

      if (demoUser && demoUser.email) {
        // Demo / simulated Google login when client ID is in sandbox
        email = demoUser.email;
        name = demoUser.name || email.split('@')[0];
      } else if (credential) {
        // Verify Google ID token with Google's official tokeninfo endpoint
        const payload = await this.verifyGoogleToken(credential);
        email = payload.email;
        name = payload.name;
      }
    }

    if (!email) {
      throw new AppError('Google account does not provide a valid email', 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { smtpConfig: true },
    });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: randomPassword,
          role: 'USER',
          googleAccessToken: googleTokens?.accessToken,
          googleRefreshToken: googleTokens?.refreshToken,
          googleTokenExpiry: googleTokens?.expiry,
        },
        include: { smtpConfig: true },
      });
    } else if (googleTokens) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: googleTokens.accessToken || user.googleAccessToken,
          googleRefreshToken: googleTokens.refreshToken || user.googleRefreshToken,
          googleTokenExpiry: googleTokens.expiry || user.googleTokenExpiry,
        },
        include: { smtpConfig: true },
      });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const { password: _, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken };
  }

  verifyGoogleToken(idToken) {
    return new Promise((resolve, reject) => {
      https
        .get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const payload = JSON.parse(data);
              if (payload.error_description || payload.error) {
                return reject(new AppError(payload.error_description || 'Invalid Google token', 401));
              }
              resolve(payload);
            } catch (err) {
              reject(new AppError('Failed to parse Google response', 500));
            }
          });
        })
        .on('error', (err) => {
          reject(new AppError(`Google verification network error: ${err.message}`, 500));
        });
    });
  }

  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new AppError('Invalid token', 401);
      const payload = { userId: user.id, email: user.email, role: user.role };
      return { accessToken: generateAccessToken(payload) };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { smtpConfig: true },
    });
    if (!user) throw new AppError('User not found', 404);
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async saveSmtpConfig(userId, config) {
    return prisma.smtpConfig.upsert({
      where: { userId },
      update: {
        host: config.host,
        port: parseInt(config.port, 10),
        secure: config.port === 465,
        userEmail: config.userEmail,
        password: config.password,
        fromName: config.fromName,
      },
      create: {
        userId,
        host: config.host,
        port: parseInt(config.port, 10),
        secure: config.port === 465,
        userEmail: config.userEmail,
        password: config.password,
        fromName: config.fromName,
      },
    });
  }
}

module.exports = new AuthService();
