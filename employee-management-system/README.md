# Outbox Mail — Automated Scheduled Email Dispatcher

A full-stack, production-ready **Email Scheduling & Outbox Automation System** built with **React, Vite, Tailwind CSS, Node.js, Express, SQLite, and Prisma ORM**.

---

## 1. What This Application Does

Instead of sending emails manually, Outbox Mail allows you to:
1. **Log in or Register** to your secure account.
2. **Compose an email** to 1 or up to **100+ recipients** at once (paste a list directly from Excel, CSV, or text).
3. **Write the subject and message body** (with rich HTML & text support).
4. **Select the exact date & time** to dispatch it (or use quick 1-click presets: *In 2 Minutes*, *In 15 Minutes*, *Tomorrow 9 AM*).
5. **Click Schedule**.
6. **Sit back**: The autonomous background scheduler automatically sends the emails when the scheduled time arrives!

---

## 2. Key Features

- **Autonomous Background Worker**: Runs every 15 seconds in the background, querying the database for due emails and dispatching them without any manual intervention.
- **Bulk Recipient Support (100+ Emails)**: Automatically detects, counts, and formats recipient lists.
- **Outbox Queue with Live Timer**: Shows all upcoming emails with countdown timers, edit, delete, or immediate **Send Now** action.
- **Sent History**: Complete delivery audit log with delivery timestamps and recipient details.
- **Outbox Dashboard**: Real-time KPI metrics (Scheduled in Outbox, Sent/Delivered, Total Processed, Failed).
- **Built-in Dispatch Simulator**: Runs immediately out of the box with zero external dependencies.
- **Live SMTP Integration**: Configure your own Gmail App Password, Outlook, or Amazon SES credentials under **Settings** to send real emails to live inboxes.

---

## 3. Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React icons
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs, Prisma ORM
- **Database**: SQLite (`prisma/dev.db`) — zero installation required
- **Scheduler**: Autonomous Node.js event loop dispatcher worker with database persistence

---

## 4. How to Run

### Backend
```powershell
cd "employee-management-system/backend"
npm run dev
```
*Backend runs at: **http://localhost:5000***

### Frontend
```powershell
cd "employee-management-system/frontend"
npm run dev
```
*Frontend runs at: **http://localhost:5173***

---

## 5. Demo Credentials

Click the purple **"Click to Fill Demo Account"** button on the login screen, or enter:
- **Email**: `admin@company.com`
- **Password**: `Admin@123`

---

## 6. Deployment Guide

Because Outbox Mail includes an active background email scheduler service (`schedulerService.start()`), continuous server platforms (Render, Railway, Fly.io, or Docker VPS) are ideal.

### Option A: Free 1-Click Deployment on Render.com (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/outbox-mail.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and click **New + > Blueprint**.
3. Connect your GitHub repository. Render will automatically read `render.yaml` and deploy both the Frontend & Backend together on the free tier!

### Option B: Deploy with Docker (Any VPS, AWS, DigitalOcean)
Run the production multi-stage container with 1 command:
```bash
docker compose up -d --build
```
The application will be running at `http://localhost:5000` with the built frontend served directly and SQLite data saved in the persistent `outbox_data` volume.

### Option C: Deploy on Railway
1. Install Railway CLI or connect via GitHub: `railway init`
2. Run: `railway up`
3. Add environment variables from `.env.example`.

