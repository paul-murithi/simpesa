# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root monorepo configuration
COPY package*.json ./
COPY tsconfig*.json ./

# Copy all workspaces
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN npm install

# Build the UI workspace
WORKDIR /app/apps/ui
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
