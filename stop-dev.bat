@echo off
echo 🛑 Stopping Smart Interview AI Development Environment...

REM Kill processes on specific ports
echo 🔍 Finding and stopping services...

REM Stop processes on port 5174 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do (
    echo 📱 Stopping Frontend service (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Stop processes on port 5001 (Backend)  
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    echo 🔧 Stopping Backend service (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Stop processes on port 8000 (AI Server)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo 🤖 Stopping AI Server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Also kill any Node.js and Python processes that might be related
echo 🧹 Cleaning up remaining processes...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM python.exe /F >nul 2>&1

echo ✅ All services stopped successfully!
echo.
pause