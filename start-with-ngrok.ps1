# Check if ngrok is available
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ngrok not found!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor Cyan
    Write-Host "  2. Extract ngrok.exe to a folder" -ForegroundColor Cyan
    Write-Host "  3. Add to PATH or update this script with full path" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing, authenticate:" -ForegroundColor Yellow
    Write-Host "  ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit
}

# Check for ngrok.yml
if (-not (Test-Path "ngrok.yml")) {
    Write-Host "ERROR: ngrok.yml not found!" -ForegroundColor Red
    Write-Host "Please create ngrok.yml with your authtoken." -ForegroundColor Yellow
    Write-Host "See ngrok.yml.example for reference." -ForegroundColor Yellow
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

# Wait for backend to start
Write-Host "   Waiting for backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start frontend
Write-Host "2. Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"

# Wait for frontend to start
Write-Host "   Waiting for frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start ngrok with config
Write-Host "3. Starting ngrok tunnels..." -ForegroundColor Cyan
Write-Host "   This will create tunnels for both backend and frontend" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok start --all --config=ngrok.yml"

# Wait for ngrok to start
Write-Host "   Waiting for ngrok to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Get ngrok URLs
Write-Host "4. Fetching ngrok URLs..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$backendUrl = $null
$frontendUrl = $null

try {
    $tunnels = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop).tunnels
    
    $backendTunnel = $tunnels | Where-Object { $_.config.addr -eq "localhost:5000" } | Select-Object -First 1
    $frontendTunnel = $tunnels | Where-Object { $_.config.addr -eq "localhost:7000" } | Select-Object -First 1
    
    if ($backendTunnel) {
        $backendUrl = $backendTunnel.public_url
        Write-Host "   Backend URL: $backendUrl" -ForegroundColor Green
    }
    
    if ($frontendTunnel) {
        $frontendUrl = $frontendTunnel.public_url
        Write-Host "   Frontend URL: $frontendUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "   Could not auto-detect URLs" -ForegroundColor Yellow
    Write-Host "   Check http://localhost:4040 for URLs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  - Local Frontend: http://localhost:7000" -ForegroundColor White
Write-Host "  - Local Backend: http://localhost:5000" -ForegroundColor White
Write-Host ""

if ($frontendUrl) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Share this URL with others:" -ForegroundColor Cyan
    Write-Host "  $frontendUrl" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Set REACT_APP_API_URL environment variable:" -ForegroundColor Red
    Write-Host "  `$env:REACT_APP_API_URL = '$backendUrl'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or restart frontend with:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  `$env:REACT_APP_API_URL = '$backendUrl'" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ngrok Web Interface: http://localhost:4040" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To get your ngrok URLs:" -ForegroundColor Yellow
    Write-Host "  1. Open: http://localhost:4040 in your browser" -ForegroundColor White
    Write-Host "  2. Look for the 'Forwarding' URLs" -ForegroundColor White
    Write-Host "  3. Copy the BACKEND URL (port 5000)" -ForegroundColor White
    Write-Host "  4. Set it as REACT_APP_API_URL environment variable" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to exit this window (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

