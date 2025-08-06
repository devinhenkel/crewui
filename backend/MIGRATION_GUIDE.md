# Python 3.12 Migration Guide for CrewAI Integration

This guide will help you migrate your CrewUI backend from Python 3.13 to Python 3.12 to enable CrewAI integration.

## Why Python 3.12?

CrewAI and its dependencies (LangChain, OpenAI) have compatibility issues with Python 3.13. Python 3.12 is the recommended version for stable CrewAI operation.

## Prerequisites

- Ubuntu/Debian system (or similar Linux distribution)
- sudo access for package installation
- Internet connection for downloading packages

## Migration Options

### Option 1: Automated Migration (Recommended)

Run the automated migration script:

```bash
./scripts/migrate_to_python312_alternative.sh
```

This script will:
- Detect available Python versions
- Offer multiple installation methods
- Set up the virtual environment
- Install all dependencies including CrewAI
- Test the installation

### Option 2: Manual Installation

#### Step 1: Install Python 3.12

**Method A: Using deadsnakes PPA (Ubuntu/Debian)**
```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev
```

**Method B: Using pyenv (Development)**
```bash
# Install pyenv
curl https://pyenv.run | bash

# Add to shell profile
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc

# Reload shell or source profile
source ~/.bashrc

# Install Python 3.12
pyenv install 3.12.7
pyenv local 3.12.7
```

#### Step 2: Set Up Virtual Environment

```bash
# Remove existing environments
rm -rf .venv venv312

# Create new environment with Python 3.12
python3.12 -m venv .venv

# Activate environment
source .venv/bin/activate

# Verify Python version
python --version  # Should show Python 3.12.x
```

#### Step 3: Install Dependencies

```bash
# Install uv if not already installed
pip install uv

# Sync dependencies
uv sync --frozen
```

#### Step 4: Test Installation

```bash
# Test CrewAI installation
python test_crewai_integration.py
```

## What Changed

### Updated Files

1. **`pyproject.toml`**
   - Changed Python requirement to `>=3.12,<3.13`
   - Re-enabled CrewAI dependencies:
     - `crewai>=0.11.0`
     - `langchain>=0.1.0,<0.2.0`
     - `langchain-openai>=0.0.2`
     - `openai>=1.7.1,<2.0.0`
     - `langchain-community>=0.0.10`

2. **`Dockerfile.dev`**
   - Updated base image to `python:3.12-slim`

3. **`scripts/dev.sh`**
   - Added Python version checking
   - Added CrewAI installation verification

4. **`requirements.txt`**
   - Already contains CrewAI dependencies (was previously commented out)

### New Files

1. **`scripts/migrate_to_python312.sh`** - Automated migration script
2. **`scripts/migrate_to_python312_alternative.sh`** - Alternative migration with multiple options
3. **`test_crewai_integration.py`** - Integration test script

## Verification

After migration, verify everything is working:

```bash
# Check Python version
python --version  # Should be 3.12.x

# Test CrewAI integration
python test_crewai_integration.py

# Start development server
./scripts/dev.sh
```

## Troubleshooting

### Common Issues

1. **Python 3.12 not found**
   - Use the alternative migration script which offers multiple installation methods
   - Or manually install using one of the methods above

2. **CrewAI import errors**
   - Ensure you're using Python 3.12
   - Reinstall dependencies: `uv sync --frozen`
   - Check for conflicting packages

3. **Permission errors**
   - Use `sudo` for system package installation
   - Ensure proper file permissions on scripts

4. **Virtual environment issues**
   - Remove existing environments: `rm -rf .venv venv312`
   - Create fresh environment with Python 3.12

### Getting Help

If you encounter issues:

1. Check the test output: `python test_crewai_integration.py`
2. Verify Python version: `python --version`
3. Check installed packages: `pip list | grep -E "(crewai|langchain|openai)"`
4. Review error messages in the migration script output

## Next Steps

After successful migration:

1. **Configure Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

2. **Start Development**
   ```bash
   ./scripts/dev.sh
   ```

3. **Test API Endpoints**
   - Visit http://localhost:8000/docs for API documentation
   - Test CrewAI-related endpoints

4. **Run Tests**
   ```bash
   uv run pytest
   ```

## Rollback

If you need to rollback to Python 3.13:

1. Restore original `pyproject.toml` (change Python requirement back to `>=3.10`)
2. Comment out CrewAI dependencies
3. Create new virtual environment with Python 3.13
4. Reinstall dependencies

---

**Note**: This migration is required for CrewAI functionality. The application will work without CrewAI on Python 3.13, but you'll lose AI agent orchestration capabilities. 