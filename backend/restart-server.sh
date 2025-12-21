#!/bin/bash

echo "🛑 Stopping any running backend processes..."
pkill -f "tsx watch src/index.ts" || true
pkill -f "npm run dev.*backend" || true
sleep 2

echo "🧹 Cleaning Prisma cache..."
cd "$(dirname "$0")"
rm -rf node_modules/.prisma ../node_modules/.prisma 2>/dev/null || true

echo "🔄 Regenerating Prisma Client..."
DATABASE_URL="file:./prisma/dev.db" npx prisma generate

echo "🚀 Starting backend server..."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

