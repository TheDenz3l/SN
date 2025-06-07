# SwiftNotes Persistent Development Server

A comprehensive development server solution that provides continuous operation, auto-reload, file watching, and health monitoring for the SwiftNotes application.

## 🚀 Quick Start

### 1. Setup (One-time)
```bash
# Install dependencies and setup environment
npm run install:deps
node setup-persistent-dev.js setup
```

### 2. Start Development Server
```bash
# Start persistent development server
npm run dev:persistent
```

### 3. Monitor Health (Optional)
```bash
# Start health monitoring in a separate terminal
npm run health:monitor
```

## 📋 Available Commands

### Basic Development Commands
- `npm run dev:persistent` - Start persistent development server
- `npm run dev:stop` - Stop persistent development server
- `npm run dev:restart` - Restart persistent development server
- `npm run dev:status` - Check server status

### PM2 Commands (Advanced)
- `npm run dev:pm2` - Start with PM2 process manager
- `npm run dev:pm2:stop` - Stop PM2 processes
- `npm run dev:pm2:restart` - Restart PM2 processes
- `npm run dev:pm2:logs` - View PM2 logs
- `npm run dev:pm2:monit` - Open PM2 monitoring dashboard

### Health Monitoring
- `npm run health:monitor` - Start continuous health monitoring
- `npm run health:check` - Perform one-time health check
- `npm run health:status` - View latest health status

### Utility Commands
- `npm run install:deps` - Install all dependencies
- `npm run setup:pm2` - Install PM2 globally
- `npm run help` - Show all available commands

## 🔧 Features

### ✅ Persistent Operation
- Runs continuously without automatic disconnection
- Survives system restarts (with PM2)
- Automatic process recovery on crashes
- Graceful shutdown handling

### ✅ Auto-reload/Hot Reload
- **Backend**: Automatic restart on file changes
- **Frontend**: Vite hot module replacement
- **Configuration**: Restart on config file changes
- **Dependencies**: Restart on package.json changes

### ✅ File Watching
Monitors key directories:
- `backend/routes/` - API route changes
- `backend/middleware/` - Middleware changes
- `backend/services/` - Service layer changes
- `frontend/src/` - Frontend component changes
- Configuration files (vite.config.ts, tailwind.config.js, etc.)

### ✅ Process Management
- **PM2 Integration**: Enterprise-grade process management
- **Memory Management**: Automatic restart on memory leaks
- **Crash Recovery**: Automatic restart on crashes
- **Log Management**: Centralized logging with rotation

### ✅ Health Monitoring
- **Continuous Monitoring**: 30-second health checks
- **Auto-recovery**: Automatic restart on health failures
- **Database Health**: Supabase connection monitoring
- **Performance Metrics**: Response time tracking

## 📊 Monitoring & Logs

### Log Locations
```
logs/
├── dev-server.log          # Main development server logs
├── backend.log             # Backend application logs
├── frontend.log            # Frontend build logs
├── health/
│   ├── monitor.log         # Health monitoring logs
│   └── latest-status.json  # Latest health status
├── restarts.log            # Process restart history
└── crashes.log             # Crash history
```

### Health Status
```bash
# Check current health status
npm run health:status

# View detailed health report
cat logs/health/latest-status.json
```

### PM2 Monitoring
```bash
# Real-time monitoring dashboard
npm run dev:pm2:monit

# View process list
pm2 list

# View logs
npm run dev:pm2:logs
```

## 🛠️ Configuration

### PM2 Ecosystem (ecosystem.config.js)
- Process definitions for backend and frontend
- File watching configuration
- Memory limits and restart policies
- Environment variables

### Nodemon Configuration (nodemon.config.js)
- File watching patterns
- Ignore patterns
- Restart behavior
- Environment settings

### Health Monitor Configuration
- Health check intervals (30 seconds)
- Failure thresholds (3 failures)
- Auto-restart policies
- Service endpoints

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports
npm run dev:stop
# Or manually
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### PM2 Not Working
```bash
# Install PM2 globally
npm install -g pm2
# Or use local PM2
npx pm2 start ecosystem.config.js
```

#### Health Monitor Failing
```bash
# Check backend health endpoint
curl http://localhost:3001/health

# Check logs
tail -f logs/health/monitor.log
```

#### File Watching Not Working
```bash
# Check file system limits (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Debug Mode
```bash
# Start with verbose logging
DEBUG=swiftnotes:* npm run dev:persistent

# PM2 debug mode
pm2 start ecosystem.config.js --log-date-format="YYYY-MM-DD HH:mm:ss Z"
```

## 🔄 Migration from Old Setup

### From Basic Server Manager
1. Stop existing servers: `npm run stop`
2. Setup persistent server: `node setup-persistent-dev.js setup`
3. Start new server: `npm run dev:persistent`

### From Manual Development
1. Install dependencies: `npm run install:deps`
2. Setup environment: `node setup-persistent-dev.js setup`
3. Start persistent server: `npm run dev:persistent`

## 🚦 Development Workflow

### Daily Development
```bash
# Start development environment
npm run dev:persistent

# In another terminal (optional)
npm run health:monitor

# Your development work here...

# Stop when done
npm run dev:stop
```

### Team Development
```bash
# Setup new team member
git clone <repo>
cd swiftnotes/SN
npm run install:deps
node setup-persistent-dev.js setup
npm run dev:persistent
```

## 📈 Performance

### Resource Usage
- **Memory**: ~200MB per process (backend + frontend)
- **CPU**: Low impact during idle, moderate during rebuilds
- **Disk**: Log rotation prevents disk space issues

### Optimization
- File watching uses efficient native watchers
- PM2 cluster mode available for production
- Health checks are lightweight HTTP requests
- Log files are automatically rotated

## 🔒 Security

### Development Security
- Health endpoints are localhost-only
- No external network exposure by default
- Environment variables are properly isolated
- Log files exclude sensitive information

### Production Considerations
- PM2 ecosystem includes production configuration
- Health monitoring can be extended for production
- Log aggregation ready for external services
- Process isolation and resource limits

## 📞 Support

### Getting Help
1. Check logs: `ls -la logs/`
2. Run health check: `npm run health:check`
3. View process status: `npm run dev:status`
4. Check documentation: `npm run help`

### Reporting Issues
Include the following information:
- Operating system and Node.js version
- Error messages from logs
- Steps to reproduce
- Health status output

---

**Happy Coding! 🎉**

The persistent development server ensures your SwiftNotes development environment runs smoothly and efficiently, allowing you to focus on building great features.
