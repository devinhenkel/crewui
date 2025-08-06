# CrewAI Configuration Platform - Backend

FastAPI backend for the CrewAI Configuration Platform with integrated CrewAI support.

## Development Setup

### Prerequisites

- **Python 3.12** (required for CrewAI compatibility)
- [pyenv](https://github.com/pyenv/pyenv) (recommended for Python version management)
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

### Python 3.12 Setup

This project requires Python 3.12 for CrewAI compatibility. If you're using a different Python version:

1. **Install pyenv** (if not already installed):
   ```bash
   # On macOS
   brew install pyenv
   
   # On Linux
   curl https://pyenv.run | bash
   ```

2. **Install Python 3.12**:
   ```bash
   pyenv install 3.12.7
   pyenv local 3.12.7
   ```

3. **Run the migration script** (automated setup):
   ```bash
   ./scripts/migrate_to_python312.sh
   ```

### Using uv (Recommended)

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Create virtual environment and install dependencies**:
   ```bash
   uv venv
   uv sync
   ```

3. **Run the development server**:
   ```bash
   ./scripts/dev.sh
   ```

### Using pip (Alternative)

1. **Create virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the development server**:
   ```bash
   uvicorn main:app --reload
   ```

## CrewAI Integration

This backend includes full CrewAI integration for AI agent orchestration:

- **CrewAI**: Multi-agent orchestration framework
- **LangChain**: LLM framework integration
- **OpenAI**: LLM provider support

### Testing CrewAI Integration

After setup, verify CrewAI is working:

```bash
python test_crewai_integration.py
```

This will test:
- Python 3.12 compatibility
- CrewAI installation
- LangChain integration
- Basic agent creation

## Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and configure:
   - Database connection
   - Redis connection
   - OpenAI API key (required for CrewAI)
   - Other settings

## API Documentation

Once the server is running, visit:
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Commands

### Code Formatting
```bash
uv run black .
uv run isort .
```

### Linting
```bash
uv run flake8 .
```

### Testing
```bash
uv run pytest
```

### Adding Dependencies
```bash
# Add a new dependency
uv add package-name

# Add a development dependency
uv add --dev package-name

# Update dependencies
uv sync
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/    # API route handlers
│   ├── core/               # Core configurations
│   └── models/             # Database models
├── scripts/
│   ├── dev.sh              # Development server script
│   └── migrate_to_python312.sh  # Migration script
├── pyproject.toml          # Project configuration and dependencies
├── uv.lock                 # Locked dependency versions
├── main.py                 # Application entry point
├── test_crewai_integration.py  # CrewAI integration test
└── .env                    # Environment variables
```