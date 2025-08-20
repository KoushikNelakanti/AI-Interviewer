#!/bin/bash

echo "🚀 Starting Ultra-Low Latency STT Interview System..."
echo

echo "📋 Checking prerequisites..."
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "Please create backend/.env with your DEEPGRAM_API_KEY"
    exit 1
fi

echo "✅ Environment file found"
echo

echo "🔧 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait 