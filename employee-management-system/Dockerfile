# Multi-stage production build for Outbox Mail Scheduler
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Setup backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

COPY backend/ ./backend/

# Final production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built frontend assets
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend application and dependencies
COPY --from=builder /app/backend ./backend

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "backend/src/server.js"]
