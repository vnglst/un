# Use Node.js 23 Debian for better compatibility
FROM node:23-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  sqlite3 \
  curl \
  unzip \
  wget \
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

# Create app user and set permissions
RUN useradd -m -u 1000 app && \
    chown -R app:app /app

# Create startup script that handles volume permissions
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🔍 Checking /app/data permissions..."\n\
ls -la /app/data || echo "Volume not mounted yet"\n\
\n\
if [ -d /app/data ]; then\n\
  echo "📂 Found mounted volume, fixing permissions..."\n\
  chown -R app:app /app/data 2>/dev/null || {\n\
    echo "⚠️  Could not change ownership. Running as root for database setup..."\n\
    test -f /app/data/un_speeches.db || npm run db:setup\n\
    chown -R app:app /app/data 2>/dev/null || echo "Database created, but ownership unchanged"\n\
  }\nelse\n\
  mkdir -p /app/data\n\
  chown app:app /app/data\n\
fi\n\
\n\
echo "🚀 Starting application as app user..."\n\
exec su app -c "test -f /app/data/un_speeches.db || npm run db:setup && exec npm start"' > /start.sh && chmod +x /start.sh

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

