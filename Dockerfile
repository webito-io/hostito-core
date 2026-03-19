# ======================== BASE ========================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ======================== DEPS ========================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile
RUN pnpm dlx prisma generate

# ======================== BUILD =======================
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

# Build NestJS
RUN pnpm run build

# Fix: force Node.js to treat compiled generated files as CommonJS
RUN echo '{"type":"commonjs"}' > dist/generated/package.json

# Remove dev dependencies
RUN pnpm prune --prod

# ======================== PRODUCTION ==================
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY prisma ./prisma/

CMD ["node", "dist/src/main"]
