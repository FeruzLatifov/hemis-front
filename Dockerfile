# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable

# Copy dependency files first (better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build args for environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME="HEMIS Ministry"
ARG VITE_SENTRY_ENABLED=false
ARG VITE_SENTRY_DSN=""

# Build production assets
RUN yarn build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine AS production

# Copy custom nginx config and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
