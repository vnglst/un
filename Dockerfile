# Keep native modules on the same Node/Debian base in every stage.
FROM node:24.22.1-slim AS base

FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run typecheck && npm run build && node scripts/dependency-smoke.cjs
# Remove build/development dependencies before copying to the runtime image.
RUN npm prune --omit=dev --offline --ignore-scripts --no-audit --no-fund && npm cache clean --force \
  && node scripts/dependency-smoke.cjs

FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl libgomp1 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

# Create startup script that checks for database in volume
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🔍 Checking for database..."\n\
\n\
if [ ! -f /app/data/un_speeches.db ]; then\n\
  echo "❌ Database not found at /app/data/un_speeches.db"\n\
  echo "Please ensure the database is uploaded to the mounted volume at /app/data"\n\
  exit 1\n\
fi\n\
\n\
echo "✅ Database found ($(du -h /app/data/un_speeches.db | cut -f1))"\n\
echo "🚀 Starting application..."\n\
cd /app\n\
exec npm start' > /start.sh && chmod +x /start.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check - give it more time and check connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://0.0.0.0:3000/health || curl -f http://localhost:3000/health || exit 1

# Use startup script that handles permissions
CMD ["/start.sh"]
