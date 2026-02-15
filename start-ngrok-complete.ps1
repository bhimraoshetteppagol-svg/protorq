# Complete ngrok setup script
# This script starts backend, frontend, and ngrok tunnels

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERROR: ngrok is not installed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Extract ngrok.exe to a folder" -ForegroundColor White
    Write-Host "  3. Add to PATH or place in this directory" -ForegroundColor White
    Write-Host ""
    Write-Host "OR install via:" -ForegroundColor Yellow
    Write-Host "  choco install ngrok" -ForegroundColor White
    Write-Host "  npm install -g ngrok" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Application with ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "[1/4] Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PORT=5000; `$env:HOST='0.0.0.0'; Write-Host 'Backend starting on port 5000...' -ForegroundColor Green; npm start"

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start ngrok for backend
Write-Host "[2/4] Starting ngrok tunnel for Backend (port 5000)..." -ForegroundColor Cyan
Write-Host "This will open a new window. Look for the 'Forwarding' URL" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend ngrok tunnel starting...' -ForegroundColor Cyan; Write-Host 'Look for the Forwarding URL below:' -ForegroundColor Yellow; Write-Host ''; ngrok http 5000"

# Wait a bit for ngrok to start
Start-Sleep -Seconds 5

# Try to get backend ngrok URL from ngrok API
Write-Host "Attempting to get backend ngrok URL..." -ForegroundColor Yellow
$backendNgrokUrl = $null
try {
    Start-Sleep -Seconds 3
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($tunnels.tunnels -and $tunnels.tunnels.Count -gt 0) {
        $backendNgrokUrl = $tunnels.tunnels[0].public_url
        Write-Host "Backend ngrok URL found: $backendNgrokUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not auto-detect backend URL. Please check the ngrok window manually." -ForegroundColor Yellow
}

# Start frontend
Write-Host "[3/4] Starting Frontend Server..." -ForegroundColor Cyan
if ($backendNgrokUrl) {
    Write-Host "Setting REACT_APP_API_URL to: $backendNgrokUrl" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:REACT_APP_API_URL='$backendNgrokUrl'; Write-Host 'Frontend starting with backend URL: $backendNgrokUrl' -ForegroundColor Green; npm start"
} else {
    Write-Host "Starting frontend without backend URL (you'll need to set it manually)" -ForegroundColor Yellow
    Write-Host "After getting backend ngrok URL, set it in the frontend terminal:" -ForegroundColor Yellow
    Write-Host "  `$env:REACT_APP_API_URL='https://your-backend-url.ngrok-free.app'" -ForegroundColor White
    Write-Host "  Then restart frontend (Ctrl+C and npm start)" -ForegroundColor White
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"
}

# Wait for frontend to start
Start-Sleep -Seconds 8

# Start ngrok for frontend
Write-Host "[4/4] Starting ngrok tunnel for Frontend (port 7000)..." -ForegroundColor Cyan
Write-Host "This will open a new window. Look for the 'Forwarding' URL" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend ngrok tunnel starting...' -ForegroundColor Cyan; Write-Host 'Look for the Forwarding URL below:' -ForegroundColor Yellow; Write-Host ''; ngrok http 7000"

# Wait a bit
Start-Sleep -Seconds 5

# Try to get frontend ngrok URL
$frontendNgrokUrl = $null
try {
    Start-Sleep -Seconds 3
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4041/api/tunnels" -ErrorAction SilentlyContinue
    if ($tunnels.tunnels -and $tunnels.tunnels.Count -gt 0) {
        $frontendNgrokUrl = $tunnels.tunnels[0].public_url
        Write-Host "Frontend ngrok URL found: $frontendNgrokUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not auto-detect frontend URL. Please check the ngrok window manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($backendNgrokUrl) {
    Write-Host "Backend ngrok URL: $backendNgrokUrl" -ForegroundColor Cyan
} else {
    Write-Host "Backend ngrok URL: Check the ngrok window (port 5000)" -ForegroundColor Yellow
}

if ($frontendNgrokUrl) {
    Write-Host "Frontend ngrok URL: $frontendNgrokUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access your app at: $frontendNgrokUrl" -ForegroundColor Green
} else {
    Write-Host "Frontend ngrok URL: Check the ngrok window (port 7000)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Red
Write-Host "  If backend URL was not auto-detected:" -ForegroundColor Yellow
Write-Host "  1. Check the backend ngrok window for the URL" -ForegroundColor White
Write-Host "  2. In the frontend terminal, run:" -ForegroundColor White
Write-Host "     `$env:REACT_APP_API_URL='https://your-backend-url.ngrok-free.app'" -ForegroundColor Green
Write-Host "  3. Restart frontend (Ctrl+C, then npm start)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
