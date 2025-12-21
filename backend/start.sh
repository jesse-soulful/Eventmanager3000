#!/bin/bash

# Start script for backend server
# This script helps diagnose and start the backend server

echo "🚀 Starting backend server..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./prisma/dev.db"
  echo "✅ Set DATABASE_URL to: $DATABASE_URL"
fi

# Check if database file exists
if [ ! -f "./prisma/dev.db" ]; then
  echo "⚠️  Database file not found. Creating it..."
  mkdir -p prisma
  touch prisma/dev.db
fi

# Check if node_modules exists
if [ ! -d "./node_modules" ]; then
  echo "⚠️  node_modules not found. Installing dependencies..."
  npm install
fi

echo ""
echo "Starting server on http://localhost:3001"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
npm run dev

