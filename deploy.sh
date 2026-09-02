#!/bin/bash
set -e

echo "🚀 Starting Deployment Process..."

echo "📥 Fetching latest code from Git..."
git pull origin main

echo "🔑 Ensuring .env configuration..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
fi

echo "🔨 Building Docker images..."
docker compose build

echo "🔄 Starting/Restarting running containers..."
docker compose up -d --force-recreate

echo "🗄️ Syncing database schema..."
docker compose exec -T nextjs-lms-alfurqon npx prisma db push --accept-data-loss || true

echo "🌱 Seeding initial database data..."
sleep 3
docker compose exec -T nextjs-lms-alfurqon wget -qO- http://localhost:3031/api/seed || true

echo "✅ Deployment completed successfully!"
