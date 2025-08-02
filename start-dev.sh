#!/bin/bash

# Get the server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "🚀 Starting CrewAI Configuration Platform Development Servers"
echo "=========================================================="
echo ""

# Start backend
echo "📡 Starting Backend (FastAPI)..."
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting Frontend (Next.js)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Both servers are running!"
echo ""
echo "🌍 Access URLs:"
echo "   Frontend (Local):     http://localhost:3000"
echo "   Frontend (External):  http://$SERVER_IP:3000"
echo "   Backend (Local):      http://localhost:8000"
echo "   Backend (External):   http://$SERVER_IP:8000"
echo "   API Docs:             http://$SERVER_IP:8000/docs"
echo ""
echo "🔧 Development:"
echo "   - Backend auto-reload: Enabled"
echo "   - Frontend hot reload: Enabled"
echo "   - CORS: Configured for external access"
echo ""
echo "📱 External Access:"
echo "   You can now access the platform from other machines on your network"
echo "   using the External URLs above."
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait 