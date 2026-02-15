# Get local IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -notlike "127.*"
} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "localhost"
    Write-Host "Using localhost (IP not detected)" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your IP Address: $ipAddress" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:" -ForegroundColor Yellow
Write-Host "  - Local: http://localhost:5000" -ForegroundColor White
Write-Host "  - Network: http://$ipAddress:5000" -ForegroundColor White
Write-Host ""
Write-Host "Frontend App:" -ForegroundColor Yellow
Write-Host "  - Local: http://localhost:7000" -ForegroundColor White
Write-Host "  - Network: http://$ipAddress:7000" -ForegroundColor White
Write-Host ""
Write-Host "Access from other devices: http://$ipAddress:7000" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PORT=5000; `$env:HOST='0.0.0.0'; npm start"

# Wait for backend
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"

Write-Host ""
Write-Host "Application started!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

