# ======================== BASE ========================
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable pnpm via corepack
RUN corepack enable
WORKDIR /app

# ======================== DEPS ========================
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm dlx prisma generate

# ======================== BUILD =======================
FROM base AS build
COPY . .
# Copy node_modules and generated prisma client from deps stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/generated ./generated

# Build the NestJS app
RUN pnpm run build

# Prune dev dependencies (this modifies node_modules)
RUN pnpm prune --prod

# ======================== RUNNER ======================
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# Copy essential files
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY prisma ./prisma

# Start server
CMD ["node", "dist/src/main"]
