@echo off
echo ====================================
echo  Amy (Python versie)
echo ====================================
echo.
echo Zorg dat de Node.js Amy (amy.js) gestopt is
echo voordat je dit start — anders botsen ze.
echo.
echo Druk een toets om te starten, of Ctrl+C om te annuleren.
pause > nul

cd /d "%~dp0"
python amy.py
pause
