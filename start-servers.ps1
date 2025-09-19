# LIA Admin Server Starter Script
# This PowerShell script starts both frontend and backend servers

Write-Host "🚀 Starting LIA Admin Development Servers..." -ForegroundColor Green
Write-Host ""

# Function to start a server
function Start-Server {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command"
    Start-Sleep -Seconds 2
}

# Start Backend Server
Start-Server -Name "Backend Server" -Path "$PSScriptRoot\backend" -Command "npm run dev"

# Start Frontend Server  
Start-Server -Name "Frontend Server" -Path "$PSScriptRoot\frontend" -Command "npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host "🔗 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔗 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips to prevent data disappearing:" -ForegroundColor Yellow
Write-Host "   • Keep both terminal windows open" -ForegroundColor White
Write-Host "   • Don't close the terminal windows" -ForegroundColor White
Write-Host "   • If data disappears, refresh the browser" -ForegroundColor White
Write-Host "   • Check the terminal for any error messages" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
