#!/bin/bash

# SwiftNotes Development Server Startup Script
# This script starts both backend and frontend servers automatically
# Designed to work around launch-process tool limitations

set -e  # Exit on any error

echo "🚀 Starting SwiftNotes Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}📁 Project root: $PROJECT_ROOT${NC}"
echo -e "${PURPLE}🔧 Designed to bypass launch-process tool limitations${NC}"

# Verify Node.js availability
if ! command -v node >/dev/null 2>&1; then
    if [ -f "/usr/local/bin/node" ]; then
        NODE_PATH="/usr/local/bin/node"
        NPM_PATH="/usr/local/bin/npm"
        echo -e "${YELLOW}📍 Using absolute paths: $NODE_PATH${NC}"
    else
        echo -e "${RED}❌ Node.js not found! Please install Node.js${NC}"
        exit 1
    fi
else
    NODE_PATH="node"
    NPM_PATH="npm"
    echo -e "${GREEN}✅ Node.js found in PATH${NC}"
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Killing any existing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Check and kill existing processes
if check_port 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use${NC}"
    kill_port 3001
fi

if check_port 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use${NC}"
    kill_port 5173
fi

# Start backend server
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd "$PROJECT_ROOT/backend"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Backend .env file not found!${NC}"
    echo -e "${YELLOW}💡 Please ensure backend/.env exists with required environment variables${NC}"
    exit 1
fi

# Start backend in background
echo -e "${GREEN}✅ Starting backend on port 3001...${NC}"
/usr/local/bin/node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if ! check_port 3001; then
    echo -e "${RED}❌ Backend failed to start! Check logs/backend.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Backend started successfully on http://localhost:3001${NC}"

# Start frontend server
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    /usr/local/bin/npm install
fi

# Start frontend in background
echo -e "${GREEN}✅ Starting frontend on port 5173...${NC}"
/usr/local/bin/node node_modules/.bin/vite --host 0.0.0.0 --port 5173 --clearScreen false > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 8

# Check if frontend is running
if ! check_port 5173; then
    echo -e "${RED}❌ Frontend failed to start! Check logs/frontend.log${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Frontend started successfully on http://localhost:5173${NC}"

# Save PIDs for later cleanup
echo "$BACKEND_PID" > "$PROJECT_ROOT/logs/backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_ROOT/logs/frontend.pid"

echo ""
echo -e "${GREEN}🎉 SwiftNotes Development Environment Ready!${NC}"
echo "=================================================="
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:3001"
echo -e "${BLUE}📊 Health:${NC}   http://localhost:3001/health"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend: $PROJECT_ROOT/logs/backend.log"
echo -e "   Frontend: $PROJECT_ROOT/logs/frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop servers:${NC} ./stop-dev.sh"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"

# Keep script running to monitor processes
trap 'echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' INT

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died!${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process died!${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    sleep 10
done
