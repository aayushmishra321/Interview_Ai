@echo off
echo ================================================================================
echo Smart Interview AI - Startup with Pre-flight Checks
echo ================================================================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

REM Check if Python is installed
echo [2/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python is installed
echo.

REM Check environment files
echo [3/6] Checking environment files...
if not exist ".env" (
    echo [ERROR] Root .env file not found!
    echo Please create .env file with required variables
    pause
    exit /b 1
)
echo [OK] Root .env exists

if not exist "backend\.env" (
    echo [ERROR] Backend .env file not found!
    echo Please create backend/.env file
    pause
    exit /b 1
)
echo [OK] Backend .env exists

if not exist "ai-server\.env" (
    echo [ERROR] AI Server .env file not found!
    echo Please create ai-server/.env file
    pause
    exit /b 1
)
echo [OK] AI Server .env exists
echo.

REM Check node_modules
echo [4/6] Checking dependencies...
if not exist "node_modules" (
    echo [WARNING] Frontend dependencies not installed
    echo Installing frontend dependencies...
    call npm install
)
echo [OK] Frontend dependencies ready

if not exist "backend\node_modules" (
    echo [WARNING] Backend dependencies not installed
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)
echo [OK] Backend dependencies ready
echo.

REM Run diagnostics
echo [5/6] Running system diagnostics...
node diagnostics.cjs
if errorlevel 1 (
    echo.
    echo [WARNING] Some diagnostics checks failed
    echo Review the errors above before continuing
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" (
        echo Startup cancelled
        pause
        exit /b 1
    )
)
echo.

REM Start servers
echo [6/6] Starting servers...
echo.
echo ================================================================================
echo Starting Backend Server (Port 5001)...
echo ================================================================================
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================================
echo Starting AI Server (Port 8000)...
echo ================================================================================
start "AI Server" cmd /k "cd ai-server && if not exist myenv (python -m venv myenv) && myenv\Scripts\activate && pip install -r requirements.txt && python src/main.py"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================================
echo Starting Frontend (Port 5175)...
echo ================================================================================
start "Frontend" cmd /k "npm run dev"

echo.
echo ================================================================================
echo All servers are starting...
echo ================================================================================
echo.
echo Backend:  http://localhost:5001
echo AI Server: http://localhost:8000
echo Frontend:  http://localhost:5175
echo.
echo Check the opened terminal windows for server status
echo Press Ctrl+C in each window to stop the servers
echo.
echo To view diagnostics again, run: node diagnostics.cjs
echo To view debugging guide: open DEBUGGING_GUIDE.md
echo.
pause
