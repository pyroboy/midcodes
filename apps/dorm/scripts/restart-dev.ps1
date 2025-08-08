# PowerShell script to restart the development server cleanly
Write-Host "Restarting development server..." -ForegroundColor Yellow

# Kill any existing Node.js processes
Write-Host "Stopping existing Node.js processes..." -ForegroundColor Blue
taskkill /f /im node.exe 2>$null

# Clean up cache directories
Write-Host "Cleaning cache directories..." -ForegroundColor Blue
if (Test-Path ".svelte-kit") { Remove-Item -Recurse -Force ".svelte-kit" }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }

# Wait a moment for cleanup
Start-Sleep -Seconds 2

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
