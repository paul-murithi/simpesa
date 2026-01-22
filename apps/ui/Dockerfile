# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./


RUN npm install

# Copy UI source code
COPY apps/ui ./apps/ui

# Build the UI. output is /app/apps/ui/dist
RUN npm run build:ui

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
