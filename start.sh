#!/bin/bash
set -e

echo "🔍 Checking /app/data permissions..."
ls -la /app/data || echo "Volume not mounted yet"

# Ensure data directory exists and has proper permissions
if [ -d /app/data ]; then
  echo "📂 Found mounted volume, fixing permissions..."
  chown -R node:node /app/data 2>/dev/null || {
    echo "⚠️  Could not change ownership, will handle as root if needed"
  }
else
  echo "📁 Creating data directory..."
  mkdir -p /app/data
  chown node:node /app/data
fi

# Check if database setup is needed
if [ ! -f /app/data/un_speeches.db ]; then
  echo "🗄️  Setting up database..."
  npm run db:setup
  # Try to fix ownership after database creation
  chown -R node:node /app/data 2>/dev/null || echo "Database created, but ownership unchanged"
fi

echo "🚀 Starting application as node user..."
exec su node -c "exec npm start"
