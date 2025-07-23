@echo off
echo Starting Calendar App Backend with proper configuration...
cd /d "%~dp0"

echo.
echo Checking if virtual environment exists...
if not exist ".venv" (
    echo Error: Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Setting environment variables...
set FLASK_APP=app.py
set FLASK_ENV=development
set FLASK_DEBUG=1

echo.
echo Checking database...
python -c "from app import create_app; app = create_app(); app.app_context().push(); from extensions import db; db.create_all(); print('Database ready!')"

echo.
echo Testing backend connection...
python -c "import requests; import time; time.sleep(1); print('Testing...'); r = requests.get('http://localhost:5000/api/events/test', timeout=5); print('Backend test:', r.json())" 2>nul || echo Backend not running yet, will start now...

echo.
echo Starting Flask server...
echo Backend will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python app.py
