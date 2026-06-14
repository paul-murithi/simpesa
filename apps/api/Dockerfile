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
COPY apps/api/ ./apps/api/

# Install all dependencies and build
RUN npm ci
RUN npm run build:api

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files for resolution
COPY apps/api/package.json ./apps/api/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/queue/package.json ./packages/queue/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Install ONLY production dependencies for the API closure
RUN npm ci --omit=dev --workspace=@app/api --workspace=@app/db --workspace=@app/queue --workspace=@app/types --workspace=@app/utils

# Copy built code and local package source from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set environment
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
