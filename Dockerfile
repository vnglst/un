# Use Node.js 23 Debian for better compatibility
FROM node:23-slim AS base

# Install dependencies needed for native modules
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

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
FROM base AS deps
# Set npm to use platform-appropriate binaries
RUN npm ci --omit=dev
# Rebuild native modules to ensure compatibility
RUN npm rebuild sqlite-vec

# Build stage
FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:23-slim AS runtime

# Install sqlite and curl for runtime (before switching to non-root user)
RUN apt-get update && apt-get install -y \
  sqlite3 \
  curl \
  unzip \
  && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs react-router

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=deps --chown=react-router:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=react-router:nodejs /app/build ./build
COPY --from=build --chown=react-router:nodejs /app/package.json ./package.json

# Copy scripts directory for database download
COPY --from=build --chown=react-router:nodejs /app/scripts ./scripts

# Copy analysis directory for analysis scripts
COPY --from=build --chown=react-router:nodejs /app/analysis ./analysis

# Create data directory for database download and potential volume mounting
RUN mkdir -p /app/data && chown react-router:nodejs /app/data

# Copy any other necessary files
COPY --chown=react-router:nodejs app/lib/topology.json ./app/lib/topology.json

# Switch to non-root user
USER react-router

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the application
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
