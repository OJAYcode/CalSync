@echo off
echo ===============================================
echo Calendar Sync Application Setup
echo ===============================================
echo.

echo Starting Backend Server...
echo.
cd /d "c:\Users\HP\Documents\CalendarApp\backend"
start "Calendar Backend" cmd /k "venv\Scripts\activate && python app_simple.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
echo.
cd /d "c:\Users\HP\Documents\CalendarApp\Sync"
start "Calendar Frontend" cmd /k "npm run dev"

echo.
echo ===============================================
echo ✅ Both servers are starting!
echo ===============================================
echo 📍 Backend:  http://localhost:5000
echo 📍 Frontend: http://localhost:5173
echo.
echo 🔍 Test Backend Health: http://localhost:5000/health
echo 🧪 Test Backend API:    http://localhost:5000/api/test
echo.
echo Press any key to exit this script...
echo ===============================================
pause > nul
