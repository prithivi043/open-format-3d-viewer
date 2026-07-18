FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Install dependencies using frozen lockfile for deterministic builds
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Add build arguments for frontend environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Build the production bundle
RUN pnpm build

# Serve stage using lightweight Nginx
FROM nginx:stable-alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx configuration for single-page application (SPA) routing fallback
# and static asset caching
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
