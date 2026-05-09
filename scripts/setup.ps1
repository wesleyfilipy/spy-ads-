# AdSpy Platform Setup Script (PowerShell)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up AdSpy Platform..." -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js is required. Download from https://nodejs.org"
    exit 1
}

# Check/install pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@9
}

# Copy env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env from .env.example — please fill in your secrets!" -ForegroundColor Green
}

# Install deps
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Start infrastructure
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Starting Postgres & Redis..." -ForegroundColor Cyan
    docker compose -f docker-compose.dev.yml up -d
    Start-Sleep -Seconds 4
} else {
    Write-Host "⚠ Docker not found — please start Postgres and Redis manually" -ForegroundColor Yellow
}

# Database setup
Write-Host "🔄 Running database setup..." -ForegroundColor Cyan
pnpm --filter @adspy/api db:push
pnpm --filter @adspy/api db:seed

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Run 'pnpm dev' to start all services" -ForegroundColor White
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  → Web:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "  → API:    http://localhost:4000" -ForegroundColor Cyan
Write-Host "  → Admin:  admin@adspy.com / Admin@123!" -ForegroundColor Yellow
Write-Host "  → Demo:   demo@adspy.com / Demo@123!" -ForegroundColor Yellow
