# Simple and Reliable ngrok Startup Script
# This script properly sets up ngrok for internet access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok Setup for Internet Access" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "ERROR: ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Yellow
    Write-Host "  1. Download: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Chocolatey: choco install ngrok" -ForegroundColor White
    Write-Host "  3. npm: npm install -g ngrok" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, authenticate:" -ForegroundColor Yellow
    Write-Host "  ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host "  (Get token from: https://dashboard.ngrok.com/get-started/your-authtoken)" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

Write-Host "Step 1: Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; `$env:PORT=5000; `$env:HOST='0.0.0.0'; Write-Host 'Backend running on port 5000' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 6

Write-Host "Step 2: Starting Backend ngrok tunnel..." -ForegroundColor Cyan
Write-Host "  Opening ngrok window for backend (port 5000)" -ForegroundColor Yellow
Write-Host "  Check the window for your backend ngrok URL" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '=== Backend ngrok Tunnel ===' -ForegroundColor Cyan; Write-Host 'Forwarding URL will appear below:' -ForegroundColor Yellow; Write-Host ''; ngrok http 5000"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Step 3: Getting backend ngrok URL..." -ForegroundColor Cyan
$backendUrl = $null
$maxRetries = 10
for ($i = 0; $i -lt $maxRetries; $i++) {
    try {
        Start-Sleep -Seconds 2
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
            if ($httpsTunnel) {
                $backendUrl = $httpsTunnel.public_url
                break
            }
        }
    } catch {
        # Continue trying
    }
}

if ($backendUrl) {
    Write-Host "  Backend URL found: $backendUrl" -ForegroundColor Green
} else {
    Write-Host "  Could not auto-detect. Please check ngrok window manually." -ForegroundColor Yellow
    Write-Host "  Look for the 'Forwarding' line in the ngrok window" -ForegroundColor Yellow
    $backendUrl = Read-Host "  Enter your backend ngrok URL (or press Enter to skip)"
    if ([string]::IsNullOrWhiteSpace($backendUrl)) {
        $backendUrl = "MANUAL_SETUP_REQUIRED"
    }
}

Write-Host ""
Write-Host "Step 4: Starting Frontend Server..." -ForegroundColor Cyan
if ($backendUrl -and $backendUrl -ne "MANUAL_SETUP_REQUIRED") {
    Write-Host "  Setting REACT_APP_API_URL to: $backendUrl" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$env:REACT_APP_API_URL='$backendUrl'; Write-Host 'Frontend starting with API: $backendUrl' -ForegroundColor Green; npm start"
} else {
    Write-Host "  Starting without API URL (you'll need to set it manually)" -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Green; Write-Host 'IMPORTANT: Set REACT_APP_API_URL in this window!' -ForegroundColor Red; npm start"
}

Start-Sleep -Seconds 8

Write-Host "Step 5: Starting Frontend ngrok tunnel..." -ForegroundColor Cyan
Write-Host "  Opening ngrok window for frontend (port 7000)" -ForegroundColor Yellow
Write-Host "  Check the window for your frontend ngrok URL" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '=== Frontend ngrok Tunnel ===' -ForegroundColor Cyan; Write-Host 'Forwarding URL will appear below:' -ForegroundColor Yellow; Write-Host ''; ngrok http 7000 --web-addr=127.0.0.1:4041"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Step 6: Getting frontend ngrok URL..." -ForegroundColor Cyan
$frontendUrl = $null
for ($i = 0; $i -lt $maxRetries; $i++) {
    try {
        Start-Sleep -Seconds 2
        $response = Invoke-RestMethod -Uri "http://localhost:4041/api/tunnels" -ErrorAction Stop
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
            if ($httpsTunnel) {
                $frontendUrl = $httpsTunnel.public_url
                break
            }
        }
    } catch {
        # Continue trying
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($backendUrl -and $backendUrl -ne "MANUAL_SETUP_REQUIRED") {
    Write-Host "Backend ngrok URL: $backendUrl" -ForegroundColor Cyan
} else {
    Write-Host "Backend ngrok URL: Check ngrok window (port 5000)" -ForegroundColor Yellow
    Write-Host "  Or visit: http://127.0.0.1:4040" -ForegroundColor White
}

if ($frontendUrl) {
    Write-Host "Frontend ngrok URL: $frontendUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Access your app at:" -ForegroundColor Green
    Write-Host "  $frontendUrl" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Share this URL with anyone to access from anywhere!" -ForegroundColor Cyan
} else {
    Write-Host "Frontend ngrok URL: Check ngrok window (port 7000)" -ForegroundColor Yellow
    Write-Host "  Or visit: http://127.0.0.1:4041" -ForegroundColor White
}

Write-Host ""
if ($backendUrl -eq "MANUAL_SETUP_REQUIRED" -or -not $backendUrl) {
    Write-Host "IMPORTANT - Manual Setup Required:" -ForegroundColor Red
    Write-Host "  1. Check backend ngrok window for the URL" -ForegroundColor Yellow
    Write-Host "  2. In the frontend terminal window, run:" -ForegroundColor Yellow
    Write-Host "     `$env:REACT_APP_API_URL='https://your-backend-url.ngrok-free.app'" -ForegroundColor Green
    Write-Host "  3. Restart frontend (Ctrl+C, then npm start)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
Write-Host "(Servers and ngrok tunnels will continue running)" -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

