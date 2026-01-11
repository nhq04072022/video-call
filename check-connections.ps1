# Quick connection check script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONNECTION STATUS CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check LiveKit
Write-Host "1. LiveKit Server (ws://localhost:7880)" -ForegroundColor Yellow
$livekit = netstat -ano | findstr ":7880"
if ($livekit) {
    Write-Host "   [OK] Running" -ForegroundColor Green
    docker ps --filter "name=livekit" --format "   Container: {{.Names}} | Status: {{.Status}}" 2>$null
} else {
    Write-Host "   [ERROR] Not running" -ForegroundColor Red
    Write-Host "   Fix: .\start-livekit.ps1" -ForegroundColor Gray
}
Write-Host ""

# Check Backend API
Write-Host "2. Backend API (http://localhost:3001)" -ForegroundColor Yellow
$api = netstat -ano | findstr ":3001"
if ($api) {
    Write-Host "   [OK] Running" -ForegroundColor Green
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   [OK] Health check passed" -ForegroundColor Green
    } catch {
        Write-Host "   [WARNING] Port open but health check failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Not running" -ForegroundColor Red
    Write-Host "   Fix: cd services/api-service && npm run dev" -ForegroundColor Gray
}
Write-Host ""

# Check Database
Write-Host "3. PostgreSQL (localhost:5432)" -ForegroundColor Yellow
$db = netstat -ano | findstr ":5432"
if ($db) {
    Write-Host "   [OK] Running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Not running" -ForegroundColor Red
}
Write-Host ""

# Check Frontend
Write-Host "4. Frontend (http://localhost:5173)" -ForegroundColor Yellow
$frontend = netstat -ano | findstr ":5173"
if ($frontend) {
    Write-Host "   [OK] Running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Not running" -ForegroundColor Red
    Write-Host "   Fix: cd frontend/apps/web && npm run dev" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$issues = @()
if (-not $livekit) { $issues += "LiveKit" }
if (-not $api) { $issues += "Backend API" }
if (-not $db) { $issues += "Database" }
if (-not $frontend) { $issues += "Frontend" }

if ($issues.Count -eq 0) {
    Write-Host "[OK] All services are running!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Missing services: $($issues -join ', ')" -ForegroundColor Yellow
}
Write-Host ""
