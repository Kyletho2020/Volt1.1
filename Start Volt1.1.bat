@echo off
REM Batch file to start the Volt1.1 application

echo.
echo ========================================
echo   Starting Volt1.1 Application
echo ========================================
echo.

REM Navigate to the Volt1.1 directory (relative to this bat file's location)
cd /d "%~dp0"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo Installing dependencies...
    echo.
    call npm install
    echo.
    echo Dependencies installed!
    echo.
)

REM Start the folder server in a separate window (creates project folders on save)
echo Starting Volt Folder Server...
start "Volt Folder Server" python "%~dp0..\execution\folder_server.py"
echo.

REM Start the development server
echo Starting Volt1.1 on http://localhost:5175
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev

pause
