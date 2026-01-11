# Script to start LiveKit server for Windows Docker Desktop
Write-Host "=== Starting LiveKit Server ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

# Stop and remove existing container if exists
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker stop livekit-server 2>$null | Out-Null
docker rm livekit-server 2>$null | Out-Null
Write-Host "[OK] Cleanup complete" -ForegroundColor Green

Write-Host ""
Write-Host "Starting LiveKit server on ws://localhost:7880..." -ForegroundColor Yellow
Write-Host ""

# Start LiveKit server for Windows Docker Desktop
# CRITICAL: Use port mapping instead of --network host (doesn't work on Windows)
# CRITICAL: Set --node-ip 127.0.0.1 so ICE candidates use localhost
docker run -d --name livekit-server `
    -p 7880:7880 `
    -p 7881:7881 `
    -p 7882:7882/udp `
    -p 50000-50020:50000-50020/udp `
    -e LIVEKIT_NODE_IP=127.0.0.1 `
    -v "${PWD}/livekit-config.yaml:/etc/livekit.yaml" `
    livekit/livekit-server `
    --config /etc/livekit.yaml `
    --dev `
    --node-ip 127.0.0.1

if ($LASTEXITCODE -eq 0) {
    Start-Sleep -Seconds 2
    Write-Host ""
    Write-Host "[OK] LiveKit server started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Details:" -ForegroundColor Cyan
    Write-Host "  WebSocket URL: ws://localhost:7880" -ForegroundColor White
    Write-Host "  TCP Port: 7881" -ForegroundColor White
    Write-Host "  UDP Ports: 50000-50020" -ForegroundColor White
    Write-Host "  Node IP: 127.0.0.1" -ForegroundColor White
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Cyan
    docker logs livekit-server --tail 5
    Write-Host ""
    Write-Host "To view logs: docker logs -f livekit-server" -ForegroundColor Gray
    Write-Host "To stop: docker stop livekit-server" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Failed to start LiveKit server" -ForegroundColor Red
    docker logs livekit-server 2>$null
}
