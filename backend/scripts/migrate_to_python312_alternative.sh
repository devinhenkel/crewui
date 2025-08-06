#!/bin/bash

# Alternative migration script for Python 3.12 with multiple installation options
set -e

echo "🚀 Starting migration to Python 3.12..."

# Function to check if Python 3.12 is available
check_python312() {
    if command -v python3.12 &> /dev/null; then
        echo "✅ Python 3.12 found: $(python3.12 --version)"
        return 0
    elif command -v pyenv &> /dev/null && pyenv versions | grep -q "3.12"; then
        echo "✅ Python 3.12 found via pyenv"
        return 0
    else
        return 1
    fi
}

# Function to install Python 3.12 via deadsnakes PPA
install_python312_deadsnakes() {
    echo "📦 Installing Python 3.12 via deadsnakes PPA..."
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt update
    sudo apt install -y python3.12 python3.12-venv python3.12-dev
}

# Function to install Python 3.12 via pyenv
install_python312_pyenv() {
    echo "📦 Installing pyenv and Python 3.12..."
    
    # Install pyenv
    if ! command -v pyenv &> /dev/null; then
        echo "Installing pyenv..."
        curl https://pyenv.run | bash
        
        # Add pyenv to shell
        echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
        echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
        echo 'eval "$(pyenv init -)"' >> ~/.bashrc
        
        # Source the updated profile
        export PYENV_ROOT="$HOME/.pyenv"
        export PATH="$PYENV_ROOT/bin:$PATH"
        eval "$(pyenv init -)"
    fi
    
    # Install Python 3.12
    pyenv install 3.12.7
    pyenv local 3.12.7
}

# Check if Python 3.12 is already available
if check_python312; then
    echo "✅ Python 3.12 is already available!"
    PYTHON_CMD="python3.12"
else
    echo "❌ Python 3.12 not found. Choose installation method:"
    echo "1. Install via deadsnakes PPA (recommended for Ubuntu/Debian)"
    echo "2. Install via pyenv (recommended for development)"
    echo "3. Continue with current Python version (may have compatibility issues)"
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            install_python312_deadsnakes
            PYTHON_CMD="python3.12"
            ;;
        2)
            install_python312_pyenv
            PYTHON_CMD="python"
            ;;
        3)
            echo "⚠️  Continuing with current Python version..."
            PYTHON_CMD="python"
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

# Verify Python version
echo "🔍 Verifying Python version..."
$PYTHON_CMD --version

# Remove existing virtual environments
echo "🧹 Cleaning up existing virtual environments..."
rm -rf .venv venv312

# Create new virtual environment
echo "🔧 Creating new virtual environment..."
$PYTHON_CMD -m venv .venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Verify Python version in virtual environment
echo "✅ Virtual environment Python version: $(python --version)"

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
echo "💡 To activate the environment, run: source .venv/bin/activate"
echo "💡 To test CrewAI integration, run: python test_crewai_integration.py" 