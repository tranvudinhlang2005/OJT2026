# =============================================================================
# Stage 1: Build Frontend Assets using Node.js
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first to utilize caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy remaining frontend source
COPY . ./

# Build application bundle
RUN npm run build

# =============================================================================
# Stage 2: Serve with Nginx & Reverse Proxy
# =============================================================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
