# Stage 1: Build
FROM node:20-alpine AS builder

# Add build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy all packages and apps
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install all dependencies and build
RUN npm ci
RUN npm run build:worker

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files for resolution
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/queue/package.json ./packages/queue/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Install ONLY production dependencies for the worker closure
RUN npm ci --omit=dev --workspace=@app/worker --workspace=@app/db --workspace=@app/queue --workspace=@app/types --workspace=@app/utils

# Copy built code and local package source from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Set environment
ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/index.js"]
