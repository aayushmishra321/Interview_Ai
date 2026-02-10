@echo off
echo ========================================
echo Testing Smart Interview AI Platform
echo ========================================

echo.
echo Testing Backend Health...
curl -s http://localhost:5001/health

echo.
echo.
echo Testing AI Server Health...
curl -s http://localhost:8000/health

echo.
echo.
echo Testing Payment Plans...
curl -s http://localhost:5001/api/payment/plans

echo.
echo.
echo ========================================
echo Tests Complete!
echo ========================================
