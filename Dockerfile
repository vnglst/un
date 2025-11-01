# Use Node.js 23 Debian for better compatibility
FROM node:23-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  sqlite3 \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (no database needed)
RUN npm run build

# Create startup script that handles volume permissions and database check
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🔍 Checking /app/data permissions..."\n\
ls -la /app/data || echo "Volume not mounted yet"\n\
\n\
if [ -d /app/data ]; then\n\
  echo "📂 Found mounted volume, fixing permissions..."\n\
  chown -R node:node /app/data 2>/dev/null || echo "⚠️  Could not change ownership"\n\
else\n\
  echo "📂 Creating /app/data directory..."\n\
  mkdir -p /app/data\n\
  chown node:node /app/data\n\
fi\n\
\n\
if [ ! -f /app/data/un_speeches.db ]; then\n\
  echo "❌ Database not found at /app/data/un_speeches.db"\n\
  echo "Please ensure the database is mounted to the /app/data volume"\n\
  exit 1\n\
fi\n\
\n\
echo "✅ Database found"\n\
echo "🚀 Starting application as node user..."\n\
cd /app\n\
exec su node -c "NODE_ENV=production exec node build/server/index.js"' > /start.sh && chmod +x /start.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use startup script that handles permissions
CMD ["/start.sh"]

