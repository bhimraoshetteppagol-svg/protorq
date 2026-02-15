# Automated ngrok setup with automatic API URL detection
# This script automatically sets the backend ngrok URL for the frontend

# Check if ngrok is available
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "ngrok not found! Please install from https://ngrok.com/download" -ForegroundColor Red
    pause
    exit
}

# Check for ngrok.yml
if (-not (Test-Path "ngrok.yml")) {
    Write-Host "ERROR: ngrok.yml not found! Please create it with your authtoken." -ForegroundColor Red
    pause
    exit
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Application with ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "1. Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PORT=5000; `$env:HOST='0.0.0.0'; npm start"

Start-Sleep -Seconds 8

# Start ngrok for backend first
Write-Host "2. Starting ngrok for Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 5000 --log=stdout"

Start-Sleep -Seconds 5

# Get backend ngrok URL
Write-Host "3. Fetching backend ngrok URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$backendUrl = $null
try {
    $tunnels = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop).tunnels
    $backendTunnel = $tunnels | Where-Object { $_.config.addr -eq "localhost:5000" } | Select-Object -First 1
    if ($backendTunnel) {
        $backendUrl = $backendTunnel.public_url
        Write-Host "   Backend URL: $backendUrl" -ForegroundColor Green
        $env:REACT_APP_API_URL = $backendUrl
    }
} catch {
    Write-Host "   Could not fetch backend URL. Please check http://localhost:4040" -ForegroundColor Yellow
}

# Start frontend with backend URL
Write-Host "4. Starting Frontend Server..." -ForegroundColor Cyan
if ($backendUrl) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:REACT_APP_API_URL = '$backendUrl'; npm start"
    Write-Host "   Frontend configured to use backend: $backendUrl" -ForegroundColor Green
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"
    Write-Host "   WARNING: Backend URL not detected. Frontend will use default localhost." -ForegroundColor Yellow
    Write-Host "   Please set REACT_APP_API_URL manually after getting ngrok URL." -ForegroundColor Yellow
}

Start-Sleep -Seconds 8

# Start ngrok for frontend (on port 4041 to avoid conflict)
Write-Host "5. Starting ngrok for Frontend..." -ForegroundColor Cyan
Write-Host "   Note: Using separate ngrok instance on port 4041" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 7000 --log=stdout"

Start-Sleep -Seconds 5

# Get frontend ngrok URL from second instance (if possible)
# Note: This is tricky since both use port 4040 by default
# We'll need to check the first instance or use ngrok config file

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local URLs:" -ForegroundColor Yellow
Write-Host "  - Frontend: http://localhost:7000" -ForegroundColor White
Write-Host "  - Backend: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "ngrok Web Interface: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "To get your ngrok URLs:" -ForegroundColor Yellow
Write-Host "  1. Check the ngrok windows that opened" -ForegroundColor White
Write-Host "  2. Or visit: http://localhost:4040" -ForegroundColor White
Write-Host "  3. Look for the 'Forwarding' URLs" -ForegroundColor White
Write-Host ""
if ($backendUrl) {
    Write-Host "Backend ngrok URL: $backendUrl" -ForegroundColor Green
    Write-Host "Frontend should automatically use this URL." -ForegroundColor Green
} else {
    Write-Host "IMPORTANT: Set REACT_APP_API_URL to the backend ngrok URL!" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

