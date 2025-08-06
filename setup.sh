#!/bin/bash

echo "🚀 Setting up CrewAI Configuration Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env
    echo "✅ uv installed"
else
    echo "ℹ️  uv is already installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p backend/uploads

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "✅ Backend environment file created"
else
    echo "ℹ️  Backend environment file already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
    echo "✅ Frontend environment file created"
else
    echo "ℹ️  Frontend environment file already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "ℹ️  Frontend dependencies already installed"
fi
cd ..

# Install backend dependencies with uv
echo "📦 Installing backend dependencies with uv..."
cd backend
if [ ! -d ".venv" ]; then
    uv venv
    echo "✅ Python virtual environment created with uv"
fi

uv sync
echo "✅ Backend dependencies installed with uv"
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. Start the development environment:"
echo "   docker compose up -d"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "To stop the environment:"
echo "   docker compose down"
echo ""
echo "To run backend locally with uv:"
echo "   cd backend && uv run uvicorn main:app --reload" 