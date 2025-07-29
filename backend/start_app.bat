@echo off
echo 🎯 CalSync Backend Startup with Database Migration
echo ================================================

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found. Creating one...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📦 Installing dependencies...
    pip install -r requirements.txt
)

REM Run the startup script with migration
echo 🚀 Starting CalSync with database migration...
python start_with_migration.py

REM Keep the window open if there's an error
if errorlevel 1 (
    echo.
    echo ❌ Application failed to start
    echo 💡 Check the error messages above
    pause
) 