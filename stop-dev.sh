#!/bin/bash

# Smart Interview AI - Stop Development Services

echo "🛑 Stopping Smart Interview AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file="pids/$name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill $pid
            sleep 2
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}Force stopping $name...${NC}"
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✓ $name stopped${NC}"
        else
            echo -e "${YELLOW}$name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file found for $name${NC}"
    fi
}

# Stop services in reverse order
stop_service "Frontend"
stop_service "Backend"
stop_service "AI-Server"

# Also kill any remaining processes on our ports
echo -e "${BLUE}Cleaning up any remaining processes...${NC}"

# Kill processes on specific ports
for port in 5174 5001 8000; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
    fi
done

# Clean up directories
rm -rf pids
echo -e "${GREEN}✓ Cleanup completed${NC}"

echo -e "${GREEN}🎉 All services stopped successfully!${NC}"