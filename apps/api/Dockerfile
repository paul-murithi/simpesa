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

# Copy API source code
COPY apps/api ./apps/api

# Build the API
RUN npm run build:api

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

CMD ["node", "dist/apps/api/server.js"]
