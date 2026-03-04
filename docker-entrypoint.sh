#!/bin/sh
# Runtime config injection — env vars → /usr/share/nginx/html/config.js
# Enterprise pattern: 1 image, all environments

cat > /usr/share/nginx/html/config.js <<EOF
window.__HEMIS_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_APP_NAME: "${VITE_APP_NAME:-HEMIS Ministry}",
  VITE_SENTRY_ENABLED: "${VITE_SENTRY_ENABLED:-false}",
  VITE_SENTRY_DSN: "${VITE_SENTRY_DSN:-}",
  VITE_SENTRY_ENVIRONMENT: "${VITE_SENTRY_ENVIRONMENT:-}",
  VITE_SENTRY_RELEASE: "${VITE_SENTRY_RELEASE:-}",
  VITE_SENTRY_TRACES_SAMPLE_RATE: "${VITE_SENTRY_TRACES_SAMPLE_RATE:-0.2}",
};
EOF

echo "Runtime config injected: VITE_API_URL=${VITE_API_URL:-<empty>}"

exec "$@"
