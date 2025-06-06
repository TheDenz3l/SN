#!/bin/bash

# SwiftNotes Development Server Stop Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping SwiftNotes Development Environment...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    echo -e "${YELLOW}🔄 Stopping $service (port $port)...${NC}"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $service stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  $service was not running${NC}"
    fi
}

# Kill processes by PID if available
if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_ROOT/logs/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}🔄 Stopping backend process (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend process stopped${NC}"
    fi
    rm -f "$PROJECT_ROOT/logs/backend.pid"
fi

if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_ROOT/logs/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}🔄 Stopping frontend process (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend process stopped${NC}"
    fi
    rm -f "$PROJECT_ROOT/logs/frontend.pid"
fi

# Kill by port as backup
kill_port 3001 "Backend"
kill_port 5173 "Frontend"

# Clean up any remaining node processes related to the project
echo -e "${YELLOW}🧹 Cleaning up any remaining processes...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

echo -e "${GREEN}✅ SwiftNotes Development Environment stopped${NC}"
echo -e "${BLUE}💡 To start again, run: ./start-dev.sh${NC}"
