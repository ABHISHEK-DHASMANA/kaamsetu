@echo off
echo ========================================================
echo   Launching KAAMSETU: India's Hyperlocal Employment
echo   "Kaam Paas Mein. Mauke Sabke Liye."
echo ========================================================
echo.

start "KAAMSETU Backend API (Port 5000)" cmd /k "cd server && npm start"
timeout /t 2 /nobreak >nul
start "KAAMSETU Client (Port 5173)" cmd /k "cd client && npm run dev"

echo Waiting for services to initialize...
timeout /t 3 /nobreak >nul

start http://localhost:5173
echo.
echo KAAMSETU is running at http://localhost:5173
echo Backend API is running at http://localhost:5000
echo.
pause
