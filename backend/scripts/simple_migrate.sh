#!/bin/bash

# Simple migration script using existing venv312
set -e

echo "🚀 Starting simple migration to Python 3.12 using existing venv312..."

# Check if venv312 exists and has Python 3.12
if [ ! -d "venv312" ]; then
    echo "❌ venv312 directory not found. Please run the full migration script first."
    exit 1
fi

# Activate the existing virtual environment
echo "🔌 Activating existing Python 3.12 virtual environment..."
source venv312/bin/activate

# Verify Python version
echo "✅ Python version: $(python --version)"

# Install uv if not already installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    pip install uv
fi

# Sync dependencies
echo "📦 Installing dependencies..."
uv sync --frozen

# Test CrewAI installation
echo "🤖 Testing CrewAI installation..."
if python -c "import crewai; print(f'✅ CrewAI version: {crewai.__version__}')" 2>/dev/null; then
    echo "✅ CrewAI is properly installed!"
else
    echo "❌ CrewAI installation failed. Please check the error messages above."
    exit 1
fi

# Run database migrations if alembic is available
if command -v alembic &> /dev/null; then
    echo "🗄️ Running database migrations..."
    uv run alembic upgrade head
else
    echo "⚠️  Alembic not found, skipping database migrations"
fi

echo "🎉 Migration completed successfully!"
echo "💡 To activate the environment, run: source venv312/bin/activate"
echo "💡 To test CrewAI integration, run: python test_crewai_integration.py"
echo "💡 To start development server, run: ./scripts/dev.sh" 