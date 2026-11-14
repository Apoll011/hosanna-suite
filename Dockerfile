# syntax=docker/dockerfile:1.7
# Monorepo image for @hosanna/api (and intermediate builds for studio).
# Build: docker compose build
# Or:    docker build -t hosanna-api --target api .

ARG NODE_VERSION=24

# ---------------------------------------------------------------------------
# Base: pnpm + workspace manifests (cached layer)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/chordpro/package.json packages/chordpro/
COPY packages/types/package.json packages/types/
COPY packages/i18n/package.json packages/i18n/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/studio/package.json apps/studio/
COPY apps/saas/package.json apps/saas/

RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# API build
# ---------------------------------------------------------------------------
FROM base AS api-build
COPY packages/config packages/config
COPY packages/auth packages/auth
COPY packages/db packages/db
COPY packages/chordpro packages/chordpro
COPY packages/types packages/types
COPY apps/api apps/api
# Prisma needs DATABASE_URL/DIRECT_URL at generate time; dummy values are fine.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hosanna?schema=public"
ENV DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hosanna?schema=public"
RUN pnpm --filter @hosanna/db db:generate \
 && pnpm --filter @hosanna/auth build \
 && pnpm --filter @hosanna/chordpro build \
 && pnpm --filter @hosanna/db build \
 && pnpm --filter @hosanna/api build

# ---------------------------------------------------------------------------
# API runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS api
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=api-build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/packages ./packages
COPY --from=api-build /app/apps/api ./apps/api

EXPOSE 3000
WORKDIR /app/apps/api
# migrate deploy is a no-op when schema is current.
CMD ["sh", "-c", "pnpm --filter @hosanna/db db:migrate && node dist/index.mjs"]

# ---------------------------------------------------------------------------
# Studio static build
# ---------------------------------------------------------------------------
FROM base AS studio-build
COPY packages/config packages/config
COPY packages/auth packages/auth
COPY packages/chordpro packages/chordpro
COPY packages/types packages/types
COPY packages/i18n packages/i18n
COPY packages/ui packages/ui
COPY apps/studio apps/studio
RUN pnpm --filter @hosanna/auth build \
 && pnpm --filter @hosanna/chordpro build \
 && pnpm --filter @hosanna/studio build

# ---------------------------------------------------------------------------
# Studio nginx runtime
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS studio
COPY docker/nginx-studio.conf /etc/nginx/conf.d/default.conf
COPY --from=studio-build /app/apps/studio/dist /usr/share/nginx/html
EXPOSE 80
