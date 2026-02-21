#!/bin/bash

# Smart Interview AI - Development Startup Script

echo "🚀 Starting Smart Interview AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Check if .env files exist
if [ -f "frontend/.env" ] && [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Environment files found${NC}"
else
    echo -e "${RED}✗ .env files not found. Please create them with your API keys${NC}"
    exit 1
fi

# Check ports
echo -e "${BLUE}Checking ports...${NC}"

if port_in_use 5174; then
    echo -e "${YELLOW}⚠ Port 5174 (Frontend) is already in use${NC}"
fi

if port_in_use 5001; then
    echo -e "${YELLOW}⚠ Port 5001 (Backend) is already in use${NC}"
fi

if port_in_use 8000; then
    echo -e "${YELLOW}⚠ Port 8000 (AI Server) is already in use${NC}"
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"

# Frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

# Backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..

# AI Server dependencies
echo -e "${YELLOW}Installing AI server dependencies...${NC}"
cd ai-server

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ AI server dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install AI server dependencies${NC}"
    exit 1
fi

# Download spaCy model
echo -e "${YELLOW}Downloading spaCy model...${NC}"
python -m spacy download en_core_web_sm

cd ..

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p ai-server/temp
mkdir -p ai-server/models

echo -e "${GREEN}✓ Directories created${NC}"

# Start services
echo -e "${BLUE}Starting services...${NC}"

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local directory=$3
    local port=$4
    
    echo -e "${YELLOW}Starting $name on port $port...${NC}"
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    # Start the service in background
    $command > "../logs/$name.log" 2>&1 &
    local pid=$!
    
    # Store PID for cleanup
    echo $pid > "../pids/$name.pid"
    
    # Wait a moment and check if process is still running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✓ $name started successfully (PID: $pid)${NC}"
    else
        echo -e "${RED}✗ Failed to start $name${NC}"
        cat "../logs/$name.log"
        exit 1
    fi
    
    if [ -n "$directory" ]; then
        cd ..
    fi
}

# Create directories for logs and PIDs
mkdir -p logs
mkdir -p pids

# Start AI Server
cd ai-server
source venv/bin/activate
start_service "AI-Server" "python src/main.py" "" "8000"
cd ..

# Wait for AI server to be ready
echo -e "${YELLOW}Waiting for AI server to be ready...${NC}"
sleep 5

# Start Backend
start_service "Backend" "npm run dev" "backend" "5001"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 3

# Start Frontend
start_service "Frontend" "npm run dev" "frontend" "5174"

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
sleep 3

echo -e "${GREEN}"
echo "🎉 Smart Interview AI is now running!"
echo ""
echo "📱 Frontend:  http://localhost:5174"
echo "🔧 Backend:   http://localhost:5001"
echo "🤖 AI Server: http://localhost:8000"
echo ""
echo "📊 Health Checks:"
echo "   Backend:   http://localhost:5001/health"
echo "   AI Server: http://localhost:8000/health"
echo ""
echo "To stop all services, run: ./stop-dev.sh"
echo -e "${NC}"

# Keep script running and show logs
echo -e "${BLUE}Showing live logs (Ctrl+C to stop):${NC}"
tail -f logs/*.log