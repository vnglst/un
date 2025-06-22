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
RUN useradd -m app && \
    chown -R app:app /app && \
    mkdir -p /app/data && \
    chown app:app /app/data

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start with database setup and application
CMD ["sh", "-c", "test -f /app/data/un_speeches.db || npm run db:setup && npm start"]

