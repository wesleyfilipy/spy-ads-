#!/usr/bin/env bash
set -e

echo "🚀 Setting up AdSpy Platform..."

# Check dependencies
if ! command -v node &>/dev/null; then echo "❌ Node.js required"; exit 1; fi
if ! command -v pnpm &>/dev/null; then echo "Installing pnpm..."; npm install -g pnpm@9; fi
if ! command -v docker &>/dev/null; then echo "⚠ Docker not found — skipping container setup"; fi

# Copy env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example — please fill in your secrets!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start dev infrastructure
echo "🐳 Starting Postgres & Redis..."
docker compose -f docker-compose.dev.yml up -d

# Wait for Postgres
echo "⏳ Waiting for Postgres..."
sleep 3

# Run migrations
echo "🔄 Running database migrations..."
pnpm --filter @adspy/api db:push

# Seed database
echo "🌱 Seeding database..."
pnpm --filter @adspy/api db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run 'pnpm dev' to start all services"
echo ""
echo "Services:"
echo "  → Web:    http://localhost:3000"
echo "  → API:    http://localhost:4000"
echo "  → Admin:  admin@adspy.com / Admin@123!"
echo "  → Demo:   demo@adspy.com / Demo@123!"
