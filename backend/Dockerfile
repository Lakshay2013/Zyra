# ── Zyra Backend ──
# Multi-stage production build

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 zyra && \
    adduser --system --uid 1001 zyra

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

USER zyra

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]
