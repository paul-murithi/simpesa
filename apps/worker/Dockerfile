# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy all packages and apps
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install all dependencies
RUN npm install

# Build the worker workspace
RUN npm run build:worker

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/db/package.json ./packages/db/package.json
COPY packages/queue/package.json ./packages/queue/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/worker/package.json ./apps/worker/package.json

# Install production dependencies only
RUN npm install --omit=dev

# Copy built code from builder
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Set environment
ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/index.js"]
