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

# Install all dependencies (including dev tools for build)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma Client (Outputs to ../generated/prisma based on your schema.prisma)
RUN pnpm dlx prisma generate

# ======================== BUILD =======================
FROM base AS build
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/generated ./generated

# Build the NestJS app
RUN pnpm run build

# Keep only production dependencies for the final image
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ======================== RUNNER ======================
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# Copy essential files from previous stages
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY prisma ./prisma

EXPOSE 3000

# Start server
CMD ["node", "dist/main"]
