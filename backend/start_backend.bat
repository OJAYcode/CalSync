@echo off
REM Calendar Sync App - SQLite Setup and Startup Script
REM This script initializes the SQLite database and starts the backend server

echo.
echo ========================================
echo   Calendar Sync App - SQLite Setup
echo ========================================
echo.

REM Set the working directory to the backend folder
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv" (
    echo 🔧 Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 🌟 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo 📦 Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Check if database exists, if not initialize it
if not exist "calendar_app.db" (
    echo 🗄️  Initializing SQLite database...
    python scripts\init_db.py
    if errorlevel 1 (
        echo ❌ Failed to initialize database
        pause
        exit /b 1
    )
) else (
    echo ✅ Database already exists: calendar_app.db
)

REM Show database information
echo.
echo 📊 Database Information:
python scripts\db_manager.py info

echo.
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.
echo 🚀 Backend server starting on http://localhost:5000
echo 🔑 Admin credentials: admin@company.com / admin123
echo 💡 Press Ctrl+C to stop the server
echo.

REM Start the Flask application
python app.py
