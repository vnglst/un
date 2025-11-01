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

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🔍 Checking database..."\n\
\n\
if [ ! -f /app/data/un_speeches.db ]; then\n\
  echo "❌ Database not found at /app/data/un_speeches.db"\n\
  exit 1\n\
fi\n\
\n\
echo "✅ Database found ($(du -h /app/data/un_speeches.db | cut -f1))"\n\
echo "🚀 Starting application..."\n\
cd /app\n\
exec node build/server/index.js' > /start.sh && chmod +x /start.sh

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

