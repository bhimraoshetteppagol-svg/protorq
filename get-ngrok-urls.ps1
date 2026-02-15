# Helper script to get ngrok URLs
# Run this if you need to find your ngrok URLs

Write-Host "Getting ngrok URLs..." -ForegroundColor Cyan
Write-Host ""

# Backend URL (port 4040)
try {
    $backendResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($backendResponse.tunnels -and $backendResponse.tunnels.Count -gt 0) {
        $backendHttps = $backendResponse.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
        if ($backendHttps) {
            Write-Host "Backend ngrok URL: $($backendHttps.public_url)" -ForegroundColor Green
            Write-Host "  Set this as REACT_APP_API_URL" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Backend ngrok not running or not accessible on port 4040" -ForegroundColor Red
}

Write-Host ""

# Frontend URL (port 4041)
try {
    $frontendResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4041/api/tunnels" -ErrorAction SilentlyContinue
    if ($frontendResponse.tunnels -and $frontendResponse.tunnels.Count -gt 0) {
        $frontendHttps = $frontendResponse.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
        if ($frontendHttps) {
            Write-Host "Frontend ngrok URL: $($frontendHttps.public_url)" -ForegroundColor Green
            Write-Host "  Share this URL to access from anywhere!" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Frontend ngrok not running or not accessible on port 4041" -ForegroundColor Red
}

Write-Host ""
Write-Host "Or check ngrok web interfaces:" -ForegroundColor Cyan
Write-Host "  Backend: http://127.0.0.1:4040" -ForegroundColor White
Write-Host "  Frontend: http://127.0.0.1:4041" -ForegroundColor White
Write-Host ""

