@echo off
echo Clearing all sample events and notifications...
cd /d "%~dp0"
python clear_events.py
echo.
echo Sample data cleared successfully!
pause
