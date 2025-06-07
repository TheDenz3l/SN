# SwiftNotes Development Setup Guide

## Quick Start (Automated)

### Option 1: Using Startup Script (Recommended)
```bash
cd /Users/bmar/Desktop/swift/SN
./start-dev.sh
```

This will automatically:
- ✅ Start backend on port 3001
- ✅ Start frontend on port 5173  
- ✅ Create log files for debugging
- ✅ Monitor both processes
- ✅ Handle port conflicts

### Option 2: Using npm Script
```bash
cd /Users/bmar/Desktop/swift/SN
npm run dev-auto
```

## Manual Start (If Automated Fails)

### Backend Only
```bash
cd /Users/bmar/Desktop/swift/SN/backend
node server.js
```

### Frontend Only
```bash
cd /Users/bmar/Desktop/swift/SN/frontend
npm run dev
# OR if npm fails:
npx vite --host 0.0.0.0 --port 5173
```

## Stopping Servers

### Automated Stop
```bash
cd /Users/bmar/Desktop/swift/SN
./stop-dev.sh
# OR
npm run stop
```

### Manual Stop
```bash
# Kill by port
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Checking Server Status

```bash
npm run status
# OR
npm run health
```

## Troubleshooting

### If Frontend Won't Start
1. Check if dependencies are installed:
   ```bash
   cd frontend && ls node_modules
   ```

2. Try manual start:
   ```bash
   cd frontend
   ./node_modules/.bin/vite --host 0.0.0.0 --port 5173
   ```

3. Check for TypeScript errors:
   ```bash
   cd frontend && npx tsc --noEmit
   ```

### If Backend Won't Start
1. Check environment file:
   ```bash
   ls backend/.env
   ```

2. Check logs:
   ```bash
   tail -f logs/backend.log
   ```

### Port Conflicts
```bash
# Check what's using the ports
lsof -i :3001
lsof -i :5173

# Kill conflicting processes
./stop-dev.sh
```

## Log Files

- Backend logs: `logs/backend.log`
- Frontend logs: `logs/frontend.log`
- Process IDs: `logs/backend.pid`, `logs/frontend.pid`

## Environment Issues

If you see "command not found" errors, the startup scripts use absolute paths:
- Node: `/usr/local/bin/node`
- npm: `/usr/local/bin/npm`

## Development Workflow

1. **Start Development**: `./start-dev.sh`
2. **Make Changes**: Edit files in `src/` directories
3. **View Changes**: Frontend auto-reloads at http://localhost:5173
4. **Stop Development**: `./stop-dev.sh`

## Notes

- ✅ **No manual startup required** - use the automated scripts
- ✅ **No stdio interference** - process management optimized
- ✅ **Automatic process monitoring** - servers restart if they crash
- ✅ **Clean shutdown** - properly kills all processes
