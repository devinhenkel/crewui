#!/bin/bash

echo "🚀 Starting CrewAI Backend Development Server..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    uv venv
fi

# Sync dependencies
echo "📦 Syncing dependencies..."
uv sync

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
fi

# Start the development server
echo "🌐 Starting development server..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload 