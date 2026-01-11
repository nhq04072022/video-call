# Simple Restart Services Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESTARTING VIDEO CALL SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check LiveKit
Write-Host "Checking LiveKit..." -ForegroundColor Yellow
docker ps --filter "name=livekit-server"
Write-Host ""

# Start Backend
Write-Host "Starting Backend API in new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services\api-service; Write-Host 'BACKEND API' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "Starting Frontend in new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend\apps\web; Write-Host 'FRONTEND' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SERVICES STARTING" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "  LiveKit:  ws://localhost:7880" -ForegroundColor White
Write-Host ""
Write-Host "Check console logs for:" -ForegroundColor Yellow
Write-Host "  - Room names (must be SAME for both users)" -ForegroundColor White
Write-Host "  - Token generation (backend window)" -ForegroundColor White
Write-Host "  - Connection details (browser console)" -ForegroundColor White
Write-Host ""

