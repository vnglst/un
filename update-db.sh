#!/bin/bash
set -e

echo "🚀 UN Speeches Database Update Script"
echo "======================================"

# Coolify application data path
REMOTE_PATH="/data/coolify/applications/l8k4wo84gs8k4k8os88kkg8g/data"

# Check if database file exists locally
if [ ! -f "data/un_speeches.db" ]; then
    echo "❌ Database file not found at data/un_speeches.db"
    echo "💡 Please ensure the database file exists locally first"
    exit 1
fi

# Get database file size for verification
DB_SIZE=$(du -h data/un_speeches.db | cut -f1)
DB_SIZE_KB=$(du -k data/un_speeches.db | cut -f1)
echo "📊 Local database size: $DB_SIZE"

# Check available disk space on server
echo "🔍 Checking available disk space on server..."
ssh root@un.koenvangilst.nl "df -h $REMOTE_PATH"

REQUIRED_SPACE=$((DB_SIZE_KB * 120 / 100))
AVAILABLE_SPACE=$(ssh root@un.koenvangilst.nl "df $REMOTE_PATH | tail -1 | awk '{print \$4}'")
if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    echo "❌ Insufficient disk space on server"
    echo "💾 Available: $(($AVAILABLE_SPACE / 1024))MB, Required: $(($REQUIRED_SPACE / 1024))MB (DB size + 20% buffer)"
    echo "🧹 Try cleaning up space or expanding the volume"
    exit 1
fi

echo "✅ Sufficient disk space available"
echo "📤 Copying database to server..."

# Use rsync with progress and resume capability instead of scp
rsync -avz --progress --partial data/un_speeches.db root@un.koenvangilst.nl:$REMOTE_PATH/

echo "🔧 Setting proper permissions on server..."
ssh root@un.koenvangilst.nl "chown 1000:1000 $REMOTE_PATH/un_speeches.db"

echo "✅ Verifying database on server..."
ssh root@un.koenvangilst.nl "ls -la $REMOTE_PATH/un_speeches.db"

echo ""
echo "🎉 Database successfully updated on server!"
echo "💡 Your next deployment will use this database from the persistent volume"
echo "⚡ No more database downloads during container startup!"
