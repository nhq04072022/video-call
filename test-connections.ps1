# Script to test all connections (LiveKit, Database, Backend API)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONNECTION STATUS CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check LiveKit Server
Write-Host "1. LiveKit Server (ws://localhost:7880)" -ForegroundColor Yellow
$livekitPort = netstat -ano | findstr ":7880"
if ($livekitPort) {
    Write-Host "   [✓] LiveKit server is running on port 7880" -ForegroundColor Green
    docker ps --filter "name=livekit" --format "   Container: {{.Names}} | Status: {{.Status}}" 2>$null
} else {
    Write-Host "   [✗] LiveKit server is NOT running" -ForegroundColor Red
    Write-Host "   Run: .\start-livekit.ps1" -ForegroundColor Gray
}
Write-Host ""

# 2. Check Backend API
Write-Host "2. Backend API (http://localhost:3001)" -ForegroundColor Yellow
$apiPort = netstat -ano | findstr ":3001"
if ($apiPort) {
    Write-Host "   [✓] Backend API is running on port 3001" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   [✓] Health check: $($response.Content)" -ForegroundColor Green
    } catch {
        Write-Host "   [!] Port is open but health check failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [✗] Backend API is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd services/api-service && npm run dev" -ForegroundColor Gray
}
Write-Host ""

# 3. Check PostgreSQL Database
Write-Host "3. PostgreSQL Database (localhost:5432)" -ForegroundColor Yellow
$dbPort = netstat -ano | findstr ":5432"
if ($dbPort) {
    Write-Host "   [✓] PostgreSQL is running on port 5432" -ForegroundColor Green
    
    # Try to test connection if psql is available
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlPath) {
        Write-Host "   Testing database connection..." -ForegroundColor Gray
        $env:PGPASSWORD = "postgres"  # Default password, user should update
        $testQuery = "SELECT 1;" | psql -U postgres -h localhost -d video_call_db -t 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [✓] Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "   [!] Database connection failed" -ForegroundColor Yellow
            Write-Host "   Check DATABASE_URL in services/api-service/.env" -ForegroundColor Gray
        }
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    } else {
        Write-Host "   [!] psql not found, cannot test connection" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [✗] PostgreSQL is NOT running" -ForegroundColor Red
    Write-Host "   Start PostgreSQL service" -ForegroundColor Gray
}
Write-Host ""

# 4. Check Frontend
Write-Host "4. Frontend (http://localhost:5173)" -ForegroundColor Yellow
$frontendPort = netstat -ano | findstr ":5173"
if ($frontendPort) {
    Write-Host "   [✓] Frontend is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "   [✗] Frontend is NOT running" -ForegroundColor Red
    Write-Host "   Run: cd frontend/apps/web && npm run dev" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allRunning = $true
if (-not $livekitPort) { 
    Write-Host "[✗] LiveKit: NOT RUNNING" -ForegroundColor Red
    $allRunning = $false
} else {
    Write-Host "[✓] LiveKit: RUNNING" -ForegroundColor Green
}

if (-not $apiPort) { 
    Write-Host "[✗] Backend API: NOT RUNNING" -ForegroundColor Red
    $allRunning = $false
} else {
    Write-Host "[✓] Backend API: RUNNING" -ForegroundColor Green
}

if (-not $dbPort) { 
    Write-Host "[✗] Database: NOT RUNNING" -ForegroundColor Red
    $allRunning = $false
} else {
    Write-Host "[✓] Database: RUNNING" -ForegroundColor Green
}

if (-not $frontendPort) { 
    Write-Host "[✗] Frontend: NOT RUNNING" -ForegroundColor Red
    $allRunning = $false
} else {
    Write-Host "[✓] Frontend: RUNNING" -ForegroundColor Green
}

Write-Host ""
if ($allRunning) {
    Write-Host "✓ All services are running!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some services are not running. Check above for details." -ForegroundColor Yellow
}
Write-Host ""
