# Use Node.js LTS Alpine for smaller image size
FROM node:22-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runtime

# Install sqlite and curl for runtime (before switching to non-root user)
RUN apk add --no-cache sqlite curl

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 react-router

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=deps --chown=react-router:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=react-router:nodejs /app/build ./build
COPY --from=build --chown=react-router:nodejs /app/package.json ./package.json

# Copy scripts directory for database download
COPY --from=build --chown=react-router:nodejs /app/scripts ./scripts

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
