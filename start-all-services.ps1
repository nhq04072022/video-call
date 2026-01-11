# Script to start all services (Backend, Frontend, LiveKit)
Write-Host "=== Starting All Services ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   [OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

# Start LiveKit
Write-Host ""
Write-Host "2. Starting LiveKit server..." -ForegroundColor Yellow
$livekitRunning = docker ps --filter "name=livekit-server" --format "{{.Names}}" | Select-String "livekit-server"
if ($livekitRunning) {
    Write-Host "   [OK] LiveKit container already running" -ForegroundColor Green
} else {
    docker run -d --name livekit-server --rm `
        -p 7880:7880 `
        -p 7881:7881 `
        -p 7882:7882/udp `
        -e LIVEKIT_KEYS="devkey: devsecret" `
        livekit/livekit-server --dev | Out-Null
    Write-Host "   [OK] LiveKit container started" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Get current script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host ""
Write-Host "3. Starting Backend API..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptDir "services\api-service"
$backendCmd = "Write-Host '=== Backend API Service ===' -ForegroundColor Green; Write-Host 'Port: 3001' -ForegroundColor Yellow; Write-Host 'Health: http://localhost:3001/health' -ForegroundColor Gray; Write-Host ''; Set-Location '$backendPath'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null
Write-Host "   [OK] Backend service starting in new window" -ForegroundColor Green

# Start Frontend
Write-Host ""
Write-Host "4. Starting Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptDir "frontend\apps\web"
$frontendCmd = "Write-Host '=== Frontend Service ===' -ForegroundColor Green; Write-Host 'Port: 5173' -ForegroundColor Yellow; Write-Host 'URL: http://localhost:5173' -ForegroundColor Gray; Write-Host ''; Set-Location '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd | Out-Null
Write-Host "   [OK] Frontend service starting in new window" -ForegroundColor Green

Write-Host ""
Write-Host "=== All Services Started ===" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - LiveKit: ws://localhost:7880" -ForegroundColor White
Write-Host ""
Write-Host "Wait 10-15 seconds for all services to fully start" -ForegroundColor Yellow

