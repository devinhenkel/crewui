#!/bin/bash

# Quick migration script that works with current Python version
set -e

echo "🚀 Starting quick migration to enable CrewAI..."

# Check current Python version
echo "🔍 Current Python version: $(python --version)"

# Create a new virtual environment with current Python
echo "📦 Creating new virtual environment..."
python -m venv .venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Verify Python version
echo "✅ Virtual environment Python version: $(python --version)"

# Install uv if not already installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    pip install uv
fi

# Install dependencies with compatibility mode
echo "📦 Installing dependencies with compatibility mode..."
pip install --upgrade pip

# Install core dependencies first
pip install fastapi uvicorn sqlalchemy alembic celery redis

# Install CrewAI with potential compatibility workarounds
echo "🤖 Installing CrewAI and dependencies..."
pip install crewai==0.11.0 langchain==0.1.0 langchain-openai==0.0.2 openai==1.99.1 langchain-community==0.0.10

# Install remaining dependencies
pip install -r requirements.txt

# Test CrewAI installation
echo "🤖 Testing CrewAI installation..."
if python -c "import crewai; print(f'✅ CrewAI version: {crewai.__version__}')" 2>/dev/null; then
    echo "✅ CrewAI is properly installed!"
else
    echo "⚠️  CrewAI installation may have issues, but continuing..."
    echo "💡 You may need to install additional system dependencies for full functionality"
fi

# Run database migrations if alembic is available
if command -v alembic &> /dev/null; then
    echo "🗄️ Running database migrations..."
    alembic upgrade head
else
    echo "⚠️  Alembic not found, skipping database migrations"
fi

echo "🎉 Quick migration completed!"
echo "💡 To activate the environment, run: source .venv/bin/activate"
echo "💡 To test CrewAI integration, run: python test_crewai_integration.py"
echo "💡 To start development server, run: ./scripts/dev.sh" 