# ngrok Startup Script for Public Access
# This script starts ngrok tunnels and the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Application with ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokInstalled) {
    Write-Host "ERROR: ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Or install via: choco install ngrok" -ForegroundColor White
    Write-Host "  3. Sign up at: https://dashboard.ngrok.com (free)" -ForegroundColor White
    Write-Host "  4. Get your authtoken and run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Starting ngrok tunnels..." -ForegroundColor Cyan
Write-Host ""

# Start backend ngrok tunnel
Write-Host "Starting Backend ngrok tunnel (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend ngrok tunnel - Check http://127.0.0.1:4040 for URL' -ForegroundColor Cyan; ngrok http 5000"

# Wait a bit for ngrok to start
Start-Sleep -Seconds 3

# Start frontend ngrok tunnel
Write-Host "Starting Frontend ngrok tunnel (port 7000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend ngrok tunnel - Check http://127.0.0.1:4041 for URL' -ForegroundColor Cyan; ngrok http 7000 --web-addr=127.0.0.1:4041"

# Wait for ngrok tunnels to establish
Write-Host ""
Write-Host "Waiting for ngrok tunnels to establish..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Function to get ngrok URL from API
function Get-NgrokUrl {
    param($Port)
    try {
        $apiUrl = if ($Port -eq 5000) { "http://127.0.0.1:4040/api/tunnels" } else { "http://127.0.0.1:4041/api/tunnels" }
        $response = Invoke-RestMethod -Uri $apiUrl -ErrorAction SilentlyContinue
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $httpsUrl = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
            if ($httpsUrl) {
                return $httpsUrl.public_url
            }
        }
    } catch {
        return $null
    }
    return $null
}

# Try to get ngrok URLs
$backendUrl = Get-NgrokUrl -Port 5000
$frontendUrl = Get-NgrokUrl -Port 7000

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ngrok Tunnels Started" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend ngrok URL:" -ForegroundColor Yellow
if ($backendUrl) {
    Write-Host "  $backendUrl" -ForegroundColor White
} else {
    Write-Host "  Check http://127.0.0.1:4040 for backend URL" -ForegroundColor White
}
Write-Host ""
Write-Host "Frontend ngrok URL:" -ForegroundColor Yellow
if ($frontendUrl) {
    Write-Host "  $frontendUrl" -ForegroundColor White
} else {
    Write-Host "  Check http://127.0.0.1:4041 for frontend URL" -ForegroundColor White
}
Write-Host ""
Write-Host "Note: If URLs are not shown above, check ngrok web interfaces:" -ForegroundColor Cyan
Write-Host "  - Backend: http://127.0.0.1:4040" -ForegroundColor White
Write-Host "  - Frontend: http://127.0.0.1:4041" -ForegroundColor White
Write-Host ""

# Start backend server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PORT=5000; `$env:HOST='0.0.0.0'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start"

# Wait for backend to start
Start-Sleep -Seconds 5

# Set environment variable for frontend if we got the backend URL
if ($backendUrl) {
    Write-Host "Setting REACT_APP_API_URL to: $backendUrl" -ForegroundColor Green
    $env:REACT_APP_API_URL = $backendUrl
} else {
    Write-Host "WARNING: Could not auto-detect backend ngrok URL" -ForegroundColor Yellow
    Write-Host "Please set REACT_APP_API_URL manually:" -ForegroundColor Yellow
    Write-Host "  1. Check http://127.0.0.1:4040 for backend URL" -ForegroundColor White
    Write-Host "  2. Run: `$env:REACT_APP_API_URL='https://YOUR-BACKEND-NGROK-URL.ngrok.io'" -ForegroundColor White
    Write-Host ""
}

# Start frontend server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
if ($backendUrl) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:REACT_APP_API_URL='$backendUrl'; Write-Host 'Frontend Server Starting with API URL: $backendUrl' -ForegroundColor Green; npm start"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; Write-Host 'Remember to set REACT_APP_API_URL!' -ForegroundColor Yellow; npm start"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
if ($frontendUrl) {
    Write-Host "Access your application at: $frontendUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Share this URL with anyone to access from anywhere!" -ForegroundColor Cyan
} else {
    Write-Host "Check http://127.0.0.1:4041 for your frontend ngrok URL" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Press any key to exit this window (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

