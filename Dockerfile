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

# Install sqlite for runtime
RUN apk add --no-cache sqlite

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 react-router

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=deps --chown=react-router:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=react-router:nodejs /app/build ./build
COPY --from=build --chown=react-router:nodejs /app/package.json ./package.json

# Copy database file if it exists
COPY --chown=react-router:nodejs un_speeches.db* ./

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]
