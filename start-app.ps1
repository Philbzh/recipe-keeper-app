# Recipe App Launcher
# Right-click → Properties → Change Icon to set a custom icon

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Recipe App..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Wait a moment, then open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

# Start the dev server
npm run dev

# Keep window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
