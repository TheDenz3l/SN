# SwiftNotes Migration Scripts
## Automated Transfer and Verification Tools

### 🚀 **Quick Migration Script**

Create this script in your new environment to automate the migration:

```bash
#!/bin/bash
# SwiftNotes Migration Script
# Run this in your new development environment

set -e

echo "🚀 SwiftNotes Migration Script"
echo "=============================="

# Configuration
SOURCE_PATH="/Users/bmar/Desktop/swift/SN"
TARGET_PATH="./SwiftNotes-New"
BACKUP_PATH="./SwiftNotes-Backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Environment Verification
log "Verifying environment requirements..."

# Check Node.js version
if ! command -v node >/dev/null 2>&1; then
    error "Node.js not found! Please install Node.js >=18.0.0"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(process.version.slice(1).split('.').map(Number).reduce((a,b,i)=>(a||0)*1000+b,0) >= '$REQUIRED_VERSION'.split('.').map(Number).reduce((a,b,i)=>(a||0)*1000+b,0) ? 0 : 1)"; then
    error "Node.js version $NODE_VERSION is too old. Required: >=$REQUIRED_VERSION"
    exit 1
fi

success "Node.js version $NODE_VERSION is compatible"

# Check npm version
if ! command -v npm >/dev/null 2>&1; then
    error "npm not found! Please install npm >=9.0.0"
    exit 1
fi

NPM_VERSION=$(npm --version)
success "npm version $NPM_VERSION found"

# Check shell capabilities
if ! echo "test" >/dev/null 2>&1; then
    error "Shell command execution failed!"
    exit 1
fi

success "Shell environment is functional"

# Step 2: Create project structure
log "Creating project directory structure..."

if [ -d "$TARGET_PATH" ]; then
    warning "Target directory exists. Creating backup..."
    mv "$TARGET_PATH" "$BACKUP_PATH"
    success "Backup created at $BACKUP_PATH"
fi

mkdir -p "$TARGET_PATH"
cd "$TARGET_PATH"

# Create directory structure
mkdir -p {backend,frontend,automation,database,docker,monitoring,logs}
success "Directory structure created"

# Step 3: Copy project files (manual step - provide instructions)
log "Project file transfer required..."
warning "MANUAL STEP REQUIRED:"
echo ""
echo "Please copy the following from your current SwiftNotes project:"
echo ""
echo "📁 Copy these directories:"
echo "  $SOURCE_PATH/backend/     → $TARGET_PATH/backend/"
echo "  $SOURCE_PATH/frontend/    → $TARGET_PATH/frontend/"
echo "  $SOURCE_PATH/monitoring/  → $TARGET_PATH/monitoring/"
echo ""
echo "📄 Copy these files:"
echo "  $SOURCE_PATH/server-manager.js → $TARGET_PATH/automation/"
echo "  $SOURCE_PATH/start-dev.sh     → $TARGET_PATH/automation/"
echo "  $SOURCE_PATH/stop-dev.sh      → $TARGET_PATH/automation/"
echo "  $SOURCE_PATH/package.json     → $TARGET_PATH/"
echo "  $SOURCE_PATH/.env             → $TARGET_PATH/"
echo ""
echo "🗄️  Copy database files:"
echo "  $SOURCE_PATH/*.sql            → $TARGET_PATH/database/"
echo ""
echo "🐳 Copy Docker files:"
echo "  $SOURCE_PATH/docker-compose.yml → $TARGET_PATH/docker/"
echo "  $SOURCE_PATH/Dockerfile         → $TARGET_PATH/docker/"
echo ""

read -p "Press Enter when file copying is complete..."

# Step 4: Install dependencies
log "Installing project dependencies..."

if [ -f "package.json" ]; then
    npm install
    success "Root dependencies installed"
else
    warning "Root package.json not found - skipping root dependencies"
fi

if [ -f "backend/package.json" ]; then
    cd backend
    npm install
    cd ..
    success "Backend dependencies installed"
else
    error "Backend package.json not found!"
    exit 1
fi

if [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    cd ..
    success "Frontend dependencies installed"
else
    error "Frontend package.json not found!"
    exit 1
fi

# Step 5: Setup automation scripts
log "Configuring automation scripts..."

if [ -f "automation/server-manager.js" ]; then
    chmod +x automation/server-manager.js
    success "server-manager.js configured"
else
    error "server-manager.js not found in automation/"
fi

if [ -f "automation/start-dev.sh" ]; then
    chmod +x automation/start-dev.sh
    success "start-dev.sh configured"
else
    error "start-dev.sh not found in automation/"
fi

if [ -f "automation/stop-dev.sh" ]; then
    chmod +x automation/stop-dev.sh
    success "stop-dev.sh configured"
else
    error "stop-dev.sh not found in automation/"
fi

# Step 6: Create convenience scripts
log "Creating convenience scripts..."

# Create root-level automation scripts
cat > start-dev.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
./automation/start-dev.sh
EOF

cat > stop-dev.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
./automation/stop-dev.sh
EOF

cat > server-manager.js << 'EOF'
#!/usr/bin/env node
// Convenience wrapper for automation/server-manager.js
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const scriptPath = path.join(__dirname, 'automation', 'server-manager.js');

const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: __dirname
});

child.on('exit', (code) => {
    process.exit(code);
});
EOF

chmod +x start-dev.sh stop-dev.sh server-manager.js

# Update package.json scripts
if [ -f "package.json" ]; then
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = {
        ...pkg.scripts,
        'dev-auto': 'node server-manager.js start',
        'dev-shell': './start-dev.sh',
        'stop': 'node server-manager.js stop',
        'status': 'node server-manager.js status',
        'servers': 'echo \"🚀 SwiftNotes Server Management:\" && echo \"  npm run dev-auto  - Start both servers\" && echo \"  npm run stop      - Stop all servers\" && echo \"  npm run status    - Check server status\"'
    };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    success "Package.json scripts updated"
fi

success "Convenience scripts created"

# Step 7: Environment verification
log "Verifying migration success..."

# Test Node.js execution
if node -e "console.log('Node.js execution test passed')"; then
    success "Node.js execution verified"
else
    error "Node.js execution failed"
fi

# Test automation scripts
if [ -f "server-manager.js" ]; then
    if node server-manager.js status >/dev/null 2>&1; then
        success "Automation scripts functional"
    else
        warning "Automation scripts need environment configuration"
    fi
fi

# Final success message
echo ""
echo "🎉 Migration script completed!"
echo "=============================="
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables in .env"
echo "2. Update Supabase and API keys"
echo "3. Test automation: npm run dev-auto"
echo "4. Verify application: http://localhost:5173"
echo ""
echo "🚀 Your SwiftNotes project is ready for automated development!"
EOF
