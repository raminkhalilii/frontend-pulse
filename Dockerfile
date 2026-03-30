# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# BACKEND_URL is a build-time server-side var; NEXT_PUBLIC_* is baked into the
# client bundle at build time. Both are supplied via --build-arg in production.
ARG BACKEND_URL
ARG NEXT_PUBLIC_API_URL

ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Ensure public/ exists so the COPY in the runner stage never fails
RUN mkdir -p /app/public

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

EXPOSE 3001

CMD ["node", "server.js"]
