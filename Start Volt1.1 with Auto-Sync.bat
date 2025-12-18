@echo off
REM Enhanced launcher that starts BOTH Volt1.1 dev server AND auto-sync
echo.
echo ========================================
echo   Starting Volt1.1 with Auto-Sync
echo ========================================
echo.

REM Navigate to the Volt1.1 directory
cd /d "c:\Users\kylet\Documents\Antigravity\Volt1.1"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo Installing dependencies...
    echo.
    call npm install
    echo.
    echo Dependencies installed!
    echo.
)

echo Starting Volt1.1 dev server...
echo Starting auto-sync to GitHub...
echo.
echo Two windows will open:
echo   1. Volt1.1 Dev Server (http://localhost:5175)
echo   2. Auto-Sync (pushes changes every 2 minutes)
echo.
echo Press any key to continue...
pause > nul

REM Start dev server in a new window
start "Volt1.1 Dev Server" cmd /k "npm run dev"

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start auto-sync in a new window
start "Volt1.1 Auto-Sync" cmd /k "powershell -ExecutionPolicy Bypass -File auto-sync.ps1"

echo.
echo ========================================
echo   Both services started!
echo ========================================
echo.
echo Dev Server: http://localhost:5175
echo Auto-Sync: Running (syncs every 2 min)
echo.
echo Close the windows to stop the services.
echo.
pause
