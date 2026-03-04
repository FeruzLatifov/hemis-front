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

# Build (env vars NOT needed — injected at runtime via ConfigMap)
RUN yarn build:prod

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine AS production

# Copy custom nginx config and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy runtime config entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
