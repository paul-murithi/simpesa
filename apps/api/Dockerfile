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

# Prune dev dependencies
RUN npm prune --omit=dev

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy built packages and app
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
