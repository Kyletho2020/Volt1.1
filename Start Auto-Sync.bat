@echo off
REM Start Auto-Sync for Volt1.1
echo.
echo ========================================
echo   Starting Volt1.1 Auto-Sync
echo ========================================
echo.
echo This will automatically push your changes
echo to GitHub every 2 minutes.
echo.
echo Press Ctrl+C to stop auto-sync
echo.
pause

REM Start the PowerShell auto-sync script
powershell -ExecutionPolicy Bypass -File "c:\Users\kylet\Documents\Antigravity\Volt1.1\auto-sync.ps1"
