# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Imagen de producción del LANDING público de Protocol 1503 (Next.js 16 ·
# `output: 'standalone'`). Multi-stage: deps → builder → runner mínimo.
# Base Debian slim (glibc) para que los módulos nativos (three / R3F) no den guerra.
#
# CANON: sin claves de servidor horneadas. La home pública no necesita Supabase;
# los NEXT_PUBLIC_* se pasan como placeholders válidos en BUILD solo para que el
# bundle del cliente no rompa al construir una URL. El candado de demo queda
# DESACTIVADO (no se define DEMO_GATE_USER/PASSWORD) → home navegable pública.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
ARG NEXT_PUBLIC_SITE_URL=https://1503.global
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs
# La salida standalone NO copia public ni .next/static → se añaden a mano.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
