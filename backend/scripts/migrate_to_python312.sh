#!/bin/bash

# Migration script to downgrade to Python 3.12 and enable CrewAI
set -e

echo "🚀 Starting migration to Python 3.12..."

# Check if pyenv is available
if ! command -v pyenv &> /dev/null; then
    echo "❌ pyenv is not installed. Please install pyenv first."
    exit 1
fi

# Check if Python 3.12 is available
if ! pyenv versions | grep -q "3.12"; then
    echo "❌ Python 3.12 is not installed via pyenv. Installing..."
    pyenv install 3.12.7
fi

# Set local Python version to 3.12.7
echo "📦 Setting local Python version to 3.12.7..."
pyenv local 3.12.7

# Remove existing virtual environments
echo "🧹 Cleaning up existing virtual environments..."
rm -rf .venv venv312

# Create new virtual environment with Python 3.12
echo "🔧 Creating new virtual environment with Python 3.12..."
python -m venv .venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

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

# Run database migrations
echo "🗄️ Running database migrations..."
uv run alembic upgrade head

echo "🎉 Migration completed successfully!"
echo "💡 To activate the environment, run: source .venv/bin/activate" 