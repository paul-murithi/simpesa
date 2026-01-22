# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm install

# Copy shared code
COPY shared ./shared

# Copy worker source code
COPY apps/worker ./apps/worker

# Build the worker
RUN npm run build:worker

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Copy shared code (if needed at runtime)
COPY --from=builder /app/shared ./shared

# Set environment
ENV NODE_ENV=production

CMD ["node", "dist/apps/worker/index.js"]
