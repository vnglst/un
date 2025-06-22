#!/bin/bash
set -e

echo "🚀 Starting UN Speeches Browser..."

# Check if database exists in persistent volume
if [ -f /app/data/un_speeches.db ]; then
    echo "✅ Database found in persistent volume, skipping download"
else
    echo "📥 Database not found in persistent volume, setting up..."
    npm run db:setup
fi

# Start the application
echo "🌐 Starting React Router server..."
exec react-router-serve ./build/server/index.js
