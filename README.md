# Outbox Mail — Automated Scheduled Email Dispatcher

A full-stack, production-ready **Email Scheduling & Outbox Automation System** built with **React, Vite, Tailwind CSS, Node.js, Express, SQLite, and Prisma ORM**.

## 🚀 Free 1-Click Deployment on Render.com

Deploy both the **Frontend** and **Backend** together on Render's 100% free tier:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ravisankarkilari-rgb/OutBox-mail-)

### Or Manual Setup on Render (2 Minutes, 100% Free):
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in with GitHub.
2. Click **New + > Web Service**.
3. Select your repository: `ravisankarkilari-rgb/OutBox-mail-`.
4. Fill in these settings:
   - **Root Directory**: `employee-management-system`
   - **Build Command**: `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend && cd backend && npx prisma generate && npx prisma db push`
   - **Start Command**: `node backend/src/server.js`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = `file:./dev.db`
   - `JWT_SECRET` = `outbox-jwt-secret-key-2026`
   - `JWT_REFRESH_SECRET` = `outbox-refresh-secret-key-2026`
   - `ADMIN_EMAIL` = `admin@company.com`
   - `ADMIN_PASSWORD` = `Admin@123`
6. Click **Deploy Web Service**!

Render will build and give you a free permanent HTTPS URL:
`https://outbox-mail-xxxx.onrender.com`

