@echo off
echo 🚀 Starting Smart Interview AI Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.11+
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please create it with your API keys
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

REM Setup AI server
echo 📦 Setting up AI server...
cd ai-server

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install AI server dependencies
    pause
    exit /b 1
)

REM Download spaCy model
echo 📥 Downloading spaCy model...
python -m spacy download en_core_web_sm

cd ..

REM Create necessary directories
echo 📁 Creating directories...
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\uploads" mkdir backend\uploads
if not exist "ai-server\temp" mkdir ai-server\temp
if not exist "ai-server\models" mkdir ai-server\models

echo ✅ Setup completed successfully!

echo.
echo 🎯 Starting services...
echo.

REM Start AI Server
echo 🤖 Starting AI Server on port 8000...
cd ai-server
start "AI Server" cmd /k "venv\Scripts\activate.bat && python src\main.py"
cd ..

REM Wait a moment for AI server to start
timeout /t 5 /nobreak >nul

REM Start Backend
echo 🔧 Starting Backend on port 5001...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 📱 Starting Frontend on port 5174...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Smart Interview AI is starting up!
echo.
echo 📱 Frontend:  http://localhost:5174
echo 🔧 Backend:   http://localhost:5001  
echo 🤖 AI Server: http://localhost:8000
echo.
echo 📊 Health Checks:
echo    Backend:   http://localhost:5001/health
echo    AI Server: http://localhost:8000/health
echo.
echo ⚠️  Please wait a few moments for all services to fully start
echo 🛑 To stop services, close the individual terminal windows or run stop-dev.bat
echo.
pause