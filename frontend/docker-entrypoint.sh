#!/bin/sh
# SwiftNotes Frontend Docker Entrypoint Script
# Handles environment variable injection and nginx startup

set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting SwiftNotes Frontend container..."

# Create runtime environment configuration
log "Generating runtime environment configuration..."

# Create env-config.js with environment variables
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-http://localhost:3001/api}',
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL:-https://ppavdpzulvosmmkzqtgy.supabase.co}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY:-}',
  VITE_APP_NAME: '${VITE_APP_NAME:-SwiftNotes}',
  VITE_APP_VERSION: '${VITE_APP_VERSION:-1.0.0}',
  VITE_DEV_MODE: '${VITE_DEV_MODE:-false}'
};
EOF

log "Environment configuration generated"

# Inject environment variables into index.html if needed
if [ -f "/usr/share/nginx/html/index.html" ]; then
    # Replace placeholder values in index.html if they exist
    sed -i "s|__VITE_API_URL__|${VITE_API_URL:-http://localhost:3001/api}|g" /usr/share/nginx/html/index.html
    sed -i "s|__VITE_APP_NAME__|${VITE_APP_NAME:-SwiftNotes}|g" /usr/share/nginx/html/index.html
    log "Index.html environment variables injected"
fi

# Validate nginx configuration
log "Validating nginx configuration..."
nginx -t

# Start nginx
log "Starting nginx..."
exec nginx -g 'daemon off;'
