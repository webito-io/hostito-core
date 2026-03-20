# ======================== BASE ========================
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ======================== DEPS ========================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ======================== BUILD =======================
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN pnpm run build
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

CMD ["node", "dist/main.js"]
