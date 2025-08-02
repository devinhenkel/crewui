# CrewAI Configuration Platform

A full-stack web application that enables users to visually configure, manage, and execute CrewAI workflows through an intuitive interface.

## Features

- **Visual Configuration**: No-code interface for CrewAI setup
- **Reusable Components**: Build once, use many times approach for agents and tasks
- **Real-time Monitoring**: Live execution feedback and file management
- **Scalable Architecture**: Support for complex multi-agent workflows

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS
- shadCN/ui
- Zustand (State Management)
- React Hook Form with Zod
- WebSocket for real-time updates

### Backend
- FastAPI (Python)
- PostgreSQL with SQLAlchemy ORM
- Celery with Redis
- CrewAI
- WebSocket support
- uv for dependency management

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker and Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd crewui
   
   # Run the automated setup script (recommended)
   ./setup.sh
   
   # Or manually:
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies with uv
   cd ../backend
   uv venv
   uv sync
   ```

2. **Set up environment variables:**
   ```bash
   # Copy environment files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

3. **Start the development environment:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or start services individually
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Start backend
   cd backend && uvicorn main:app --reload
   
   # Start frontend
   cd frontend && npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Project Structure

```
crewui/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript type definitions
├── backend/                 # FastAPI application
│   ├── app/                 # Application modules
│   ├── models/              # Database models
│   ├── api/                 # API routes
│   └── core/                # Core configurations
├── docker-compose.yml       # Development environment
└── README.md               # This file
```

## Development Workflow

1. **Frontend Development:**
   - Run `npm run dev` in the frontend directory
   - Access at http://localhost:3000
   - Hot reload enabled

2. **Backend Development:**
   - Run `uv run uvicorn main:app --reload` in the backend directory
   - Access API at http://localhost:8000
   - Auto-reload on code changes

3. **Database:**
   - PostgreSQL runs on port 5432
   - Redis runs on port 6379
   - Use Docker Compose for easy setup

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test` (frontend) and `pytest` (backend)
4. Submit a pull request

## License

MIT License
