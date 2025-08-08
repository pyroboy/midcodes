# PowerShell script to fix HMR issues
Write-Host "Fixing HMR issues..." -ForegroundColor Yellow

# Kill any existing Node.js processes
Write-Host "Stopping existing Node.js processes..." -ForegroundColor Blue
taskkill /f /im node.exe 2>$null

# Clean up problematic cache directories
Write-Host "Cleaning cache directories..." -ForegroundColor Blue
if (Test-Path ".svelte-kit") { 
    Remove-Item -Recurse -Force ".svelte-kit" 
    Write-Host "  Removed .svelte-kit" -ForegroundColor Green
}
if (Test-Path "node_modules\.vite") { 
    Remove-Item -Recurse -Force "node_modules\.vite" 
    Write-Host "  Removed node_modules\.vite" -ForegroundColor Green
}
if (Test-Path "build") { 
    Remove-Item -Recurse -Force "build" 
    Write-Host "  Removed build" -ForegroundColor Green
}

# Wait for cleanup
Write-Host "Waiting for cleanup..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Sync SvelteKit
Write-Host "Syncing SvelteKit..." -ForegroundColor Blue
npx svelte-kit sync

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
