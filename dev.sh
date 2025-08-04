#!/bin/bash

echo "🚀 Starting CrewAI Configuration Platform development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development environment..."
    docker compose down
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the services
echo "📦 Starting services with Docker Compose..."
docker compose up --build

# This will keep running until interrupted 
