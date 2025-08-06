#!/bin/bash

echo "🚀 Starting CrewAI Backend Development Server..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if venv312 exists and use it if available
if [ -d "venv312" ]; then
    echo "📦 Found existing Python 3.12 virtual environment (venv312)"
    echo "🔌 Activating venv312..."
    source venv312/bin/activate
    
    # Verify Python version
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$PYTHON_VERSION" = "3.12" ]; then
        echo "✅ Using Python 3.12 from venv312"
    else
        echo "⚠️  Warning: venv312 has Python $PYTHON_VERSION, but 3.12 is recommended"
    fi
else
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo "📦 Creating virtual environment..."
        uv venv
    fi
    
    # Check Python version
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$PYTHON_VERSION" != "3.12" ]; then
        echo "⚠️  Warning: Python version is $PYTHON_VERSION, but 3.12 is recommended for CrewAI compatibility"
        echo "   Consider running: ./scripts/migrate_to_python312.sh"
    fi
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

# Verify CrewAI installation
echo "🤖 Checking CrewAI installation..."
if uv run python -c "import crewai; print(f'✅ CrewAI version: {crewai.__version__}')" 2>/dev/null; then
    echo "✅ CrewAI is properly installed and ready to use!"
else
    echo "❌ CrewAI installation check failed. Please run: ./scripts/simple_migrate.sh"
    exit 1
fi

# Start the development server
echo "🌐 Starting development server..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload 