# CrewAI Configuration Platform - Backend

FastAPI backend for the CrewAI Configuration Platform.

## Development Setup

### Prerequisites

- Python 3.9+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

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
   uv run uvicorn main:app --reload
   ```

### Using pip (Alternative)

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the development server**:
   ```bash
   uvicorn main:app --reload
   ```

## Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and configure:
   - Database connection
   - Redis connection
   - OpenAI API key
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
├── pyproject.toml          # Project configuration and dependencies
├── uv.lock                 # Locked dependency versions
├── main.py                 # Application entry point
└── .env                    # Environment variables
``` 