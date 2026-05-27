# ============================================================
# Multi-stage Dockerfile — delivery-backend (NestJS)
# Build context: repo root (needed for the workspace lock file)
#
# Stage 1: deps      — install production + dev deps
# Stage 2: builder   — compile TypeScript → dist/
# Stage 3: production — lean runtime image (~200 MB)
# ============================================================

# ---- Base image shared by all stages ----------------------
FROM node:22-alpine AS base
WORKDIR /repo
RUN corepack enable


# ---- Stage 1: install ALL dependencies (dev included) -----
FROM base AS deps
# Copy workspace manifests so npm can resolve the lock file
COPY package.json package-lock.json ./
COPY apps/delivery-backend/package.json ./apps/delivery-backend/package.json
# Install only this workspace's deps (hoisted into /repo/node_modules)
RUN npm ci --workspace=apps/delivery-backend


# ---- Stage 2: compile TypeScript --------------------------
FROM deps AS builder
COPY apps/delivery-backend/ ./apps/delivery-backend/
# Run nest build from within the workspace
RUN npm run build --workspace=apps/delivery-backend


# ---- Stage 3: production image ----------------------------
FROM base AS production

ENV NODE_ENV=production

# Reinstall production deps only
COPY package.json package-lock.json ./
COPY apps/delivery-backend/package.json ./apps/delivery-backend/package.json
RUN npm ci --workspace=apps/delivery-backend --omit=dev \
  && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /repo/apps/delivery-backend/dist ./apps/delivery-backend/dist

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Node resolution walks up to /repo/node_modules automatically
WORKDIR /repo/apps/delivery-backend
EXPOSE 3001

CMD ["node", "dist/main"]
