# SwiftNotes Quick Start Migration
## 5-Minute Setup for New Environment

### 🚀 **Fastest Migration Path**

**For immediate setup in a new environment:**

#### **Step 1: Environment Check (30 seconds)**
```bash
# Quick compatibility test
node --version  # Should be >=18.0.0
npm --version   # Should be >=9.0.0
echo "test" && pwd && ls  # Basic commands should work
```

#### **Step 2: Create Project (1 minute)**
```bash
# Create new project directory
mkdir SwiftNotes-New && cd SwiftNotes-New

# Create structure
mkdir -p {backend,frontend,automation,logs}
```

#### **Step 3: Copy Files (2 minutes)**
**Copy these from your current SwiftNotes project:**

**Essential Files:**
- `backend/` → `SwiftNotes-New/backend/`
- `frontend/` → `SwiftNotes-New/frontend/`
- `server-manager.js` → `SwiftNotes-New/automation/`
- `start-dev.sh` → `SwiftNotes-New/automation/`
- `stop-dev.sh` → `SwiftNotes-New/automation/`
- `package.json` → `SwiftNotes-New/`
- `.env` → `SwiftNotes-New/`

#### **Step 4: Install Dependencies (1 minute)**
```bash
# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

#### **Step 5: Setup Automation (30 seconds)**
```bash
# Make scripts executable
chmod +x automation/*.sh automation/*.js

# Create convenience scripts
ln -s automation/server-manager.js server-manager.js
ln -s automation/start-dev.sh start-dev.sh
ln -s automation/stop-dev.sh stop-dev.sh

# Update package.json
npm pkg set scripts.dev-auto="node server-manager.js start"
npm pkg set scripts.stop="node server-manager.js stop"
npm pkg set scripts.status="node server-manager.js status"
```

#### **Step 6: Test Automation (30 seconds)**
```bash
# Test the automation
npm run dev-auto
```

**Expected Result:**
```
🚀 Starting SwiftNotes Development Environment...
🔧 Starting backend server...
✅ Backend started successfully on http://localhost:3001
🎨 Starting frontend server...
✅ Frontend started successfully on http://localhost:5173

🎉 SwiftNotes Development Environment Ready!
🌐 Frontend: http://localhost:5173
🔧 Backend: http://localhost:3001
```

### ✅ **Success Verification**

**Test these URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

**Test automation commands:**
- `npm run status` - Check server status
- `npm run stop` - Stop all servers
- `npm run dev-auto` - Start both servers

### 🎯 **Migration Complete!**

Your SwiftNotes project is now running in a fully functional environment with complete automation support!

**Key Benefits:**
- ✅ **Automated server startup** - No manual terminal commands
- ✅ **Process monitoring** - Automatic restart and health checks
- ✅ **Clean shutdown** - Proper cleanup of all processes
- ✅ **Development workflow** - Hot reload and debugging
- ✅ **Professional setup** - Enterprise-grade automation

**Development Commands:**
```bash
npm run dev-auto    # Start development environment
npm run stop        # Stop all servers
npm run status      # Check server status
npm run health      # Test backend health
```

🚀 **Happy coding with your fully automated SwiftNotes development environment!**
