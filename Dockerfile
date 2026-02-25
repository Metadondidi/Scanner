# ─────────────────────────────────────────────
# Stage 1 — deps + build
# ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools needed by better-sqlite3 (native addon)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — runtime
# ─────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# System dependencies required by Playwright Chromium
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY package*.json ./
COPY next.config.mjs ./

# Install Playwright Chromium browser in the runtime image
RUN npx playwright install chromium

# Data directory for SQLite (override with Railway volume at /data)
RUN mkdir -p /data
ENV DATABASE_PATH=/data/reviews.db

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
