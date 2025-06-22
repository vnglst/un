#!/bin/bash
set -e

echo "🚀 UN Speeches Database Update Script"
echo "======================================"

# Check if database file exists locally
if [ ! -f "data/un_speeches.db" ]; then
    echo "❌ Database file not found at data/un_speeches.db"
    echo "💡 Run 'npm run db:download' first to get the database locally"
    exit 1
fi

# Get database file size for verification
DB_SIZE=$(du -h data/un_speeches.db | cut -f1)
echo "📊 Local database size: $DB_SIZE"

echo "📤 Copying database to server..."
scp data/un_speeches.db root@un.koenvangilst.nl:/sqlitedata/

echo "🔧 Setting proper permissions on server..."
ssh root@un.koenvangilst.nl "chown 1000:1000 /sqlitedata/un_speeches.db"

echo "✅ Verifying database on server..."
ssh root@un.koenvangilst.nl "ls -la /sqlitedata/un_speeches.db"

echo ""
echo "🎉 Database successfully updated on server!"
echo "💡 Your next deployment will use this database from the persistent volume"
echo "⚡ No more database downloads during container startup!"
