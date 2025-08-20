@echo off
echo 🚀 Starting Ultra-Low Latency STT Interview System...
echo.

echo 📋 Checking prerequisites...
if not exist "backend\.env" (
    echo ❌ Backend .env file not found!
    echo Please create backend\.env with your DEEPGRAM_API_KEY
    pause
    exit /b 1
)

echo ✅ Environment file found
echo.

echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers started!
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend: http://localhost:3000
echo.
echo Press any key to open the application...
pause > nul
start http://localhost:5173 