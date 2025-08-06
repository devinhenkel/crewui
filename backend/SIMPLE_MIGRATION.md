# Simple CrewAI Migration Guide

## Quick Start (Recommended)

The easiest way to enable CrewAI in your project is to use the quick migration script:

```bash
./scripts/quick_migrate.sh
```

This script will:
1. Use your current Python version (3.13)
2. Create a new virtual environment
3. Install CrewAI and all dependencies
4. Test the installation

## What Changed

### ✅ **Updated Configuration**
- **`pyproject.toml`**: Re-enabled CrewAI dependencies with flexible Python version requirement
- **`requirements.txt`**: Already contains CrewAI dependencies
- **`scripts/quick_migrate.sh`**: New simple migration script

### ✅ **CrewAI Dependencies Enabled**
```toml
"crewai>=0.11.0",
"langchain>=0.1.0,<0.2.0",
"langchain-openai>=0.0.2",
"openai>=1.7.1,<2.0.0",
"langchain-community>=0.0.10",
```

## Migration Options

### Option 1: Quick Migration (Current Python)
```bash
./scripts/quick_migrate.sh
```
- Uses your current Python 3.13
- May have some compatibility warnings but should work
- Fastest option

### Option 2: Python 3.12 Migration (If Needed)
If you encounter issues with Python 3.13, you can still use Python 3.12:

```bash
# Install Python 3.12 via deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Then run the alternative migration
./scripts/migrate_to_python312_alternative.sh
```

## Testing

After migration, test CrewAI integration:

```bash
# Activate environment
source .venv/bin/activate

# Test CrewAI
python test_crewai_integration.py

# Start development server
./scripts/dev.sh
```

## Troubleshooting

### Common Issues

1. **Import errors with CrewAI**
   - Try the quick migration first
   - If issues persist, use Python 3.12 migration

2. **Missing system dependencies**
   - Install development libraries: `sudo apt install python3-dev`
   - For SQLite issues: `sudo apt install libsqlite3-dev`

3. **Version conflicts**
   - Use the quick migration script which handles dependencies carefully
   - Or use `pip install --force-reinstall` for problematic packages

## Next Steps

1. **Configure Environment**
   ```bash
   cp env.example .env
   # Add your OpenAI API key to .env
   ```

2. **Start Development**
   ```bash
   ./scripts/dev.sh
   ```

3. **Test API**
   - Visit http://localhost:8000/docs
   - Test CrewAI endpoints

## Benefits

- ✅ **CrewAI Integration**: Full AI agent orchestration capabilities
- ✅ **Flexible Python Support**: Works with Python 3.10+ (3.12 recommended)
- ✅ **Simple Setup**: One-command migration
- ✅ **Backward Compatible**: Existing code continues to work

---

**Recommendation**: Start with the quick migration script. It's the fastest way to get CrewAI working with your current setup. 