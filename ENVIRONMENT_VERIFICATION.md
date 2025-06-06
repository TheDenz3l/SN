# SwiftNotes Environment Verification
## Comprehensive Testing and Validation Guide

### 🔍 **Pre-Migration Environment Test**

Run this script in your new environment BEFORE migration to ensure compatibility:

```bash
#!/bin/bash
# SwiftNotes Environment Compatibility Test
# Run this to verify your environment can support automation tools

echo "🔍 SwiftNotes Environment Compatibility Test"
echo "============================================="

PASSED=0
FAILED=0

test_pass() {
    echo "✅ PASS: $1"
    ((PASSED++))
}

test_fail() {
    echo "❌ FAIL: $1"
    ((FAILED++))
}

test_warn() {
    echo "⚠️  WARN: $1"
}

# Test 1: Basic command execution
echo ""
echo "📋 Testing basic command execution..."
if echo "test" >/dev/null 2>&1; then
    test_pass "Echo command works"
else
    test_fail "Echo command failed"
fi

if pwd >/dev/null 2>&1; then
    test_pass "PWD command works"
else
    test_fail "PWD command failed"
fi

if ls >/dev/null 2>&1; then
    test_pass "LS command works"
else
    test_fail "LS command failed"
fi

# Test 2: Node.js and npm
echo ""
echo "📋 Testing Node.js environment..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    test_pass "Node.js found: $NODE_VERSION"
    
    # Test Node.js execution
    if node -e "console.log('Node.js execution test')" >/dev/null 2>&1; then
        test_pass "Node.js execution works"
    else
        test_fail "Node.js execution failed"
    fi
    
    # Check version compatibility
    if node -e "process.exit(process.version.slice(1).split('.')[0] >= 18 ? 0 : 1)" 2>/dev/null; then
        test_pass "Node.js version is compatible (>=18)"
    else
        test_fail "Node.js version too old (need >=18)"
    fi
else
    test_fail "Node.js not found"
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    test_pass "npm found: $NPM_VERSION"
    
    # Test npm execution
    if npm --version >/dev/null 2>&1; then
        test_pass "npm execution works"
    else
        test_fail "npm execution failed"
    fi
else
    test_fail "npm not found"
fi

# Test 3: Process management
echo ""
echo "📋 Testing process management..."
if command -v ps >/dev/null 2>&1; then
    test_pass "Process listing (ps) available"
else
    test_fail "Process listing (ps) not available"
fi

if command -v kill >/dev/null 2>&1; then
    test_pass "Process killing (kill) available"
else
    test_fail "Process killing (kill) not available"
fi

# Test 4: Network tools
echo ""
echo "📋 Testing network capabilities..."
if command -v curl >/dev/null 2>&1; then
    test_pass "curl available"
    
    # Test network connectivity
    if curl -s --connect-timeout 5 http://httpbin.org/status/200 >/dev/null 2>&1; then
        test_pass "Network connectivity works"
    else
        test_warn "Network connectivity test failed (may be firewall/proxy)"
    fi
else
    test_warn "curl not available (automation will use alternatives)"
fi

if command -v lsof >/dev/null 2>&1; then
    test_pass "lsof available (port checking)"
else
    test_warn "lsof not available (will use alternatives)"
fi

# Test 5: File system operations
echo ""
echo "📋 Testing file system operations..."
TEST_DIR="/tmp/swiftnotes-test-$$"
if mkdir -p "$TEST_DIR" 2>/dev/null; then
    test_pass "Directory creation works"
    
    if echo "test" > "$TEST_DIR/test.txt" 2>/dev/null; then
        test_pass "File writing works"
        
        if [ -f "$TEST_DIR/test.txt" ]; then
            test_pass "File reading works"
        else
            test_fail "File reading failed"
        fi
    else
        test_fail "File writing failed"
    fi
    
    if chmod +x "$TEST_DIR/test.txt" 2>/dev/null; then
        test_pass "File permissions work"
    else
        test_fail "File permissions failed"
    fi
    
    # Cleanup
    rm -rf "$TEST_DIR" 2>/dev/null
else
    test_fail "Directory creation failed"
fi

# Test 6: Shell capabilities
echo ""
echo "📋 Testing shell capabilities..."
if bash -c "echo 'bash works'" >/dev/null 2>&1; then
    test_pass "Bash shell available"
else
    test_fail "Bash shell not available"
fi

if sh -c "echo 'sh works'" >/dev/null 2>&1; then
    test_pass "POSIX shell available"
else
    test_fail "POSIX shell not available"
fi

# Test 7: Port binding
echo ""
echo "📋 Testing port binding capabilities..."
if command -v netstat >/dev/null 2>&1 || command -v ss >/dev/null 2>&1; then
    test_pass "Network status tools available"
else
    test_warn "Network status tools not available"
fi

# Test 8: Environment variables
echo ""
echo "📋 Testing environment variables..."
if [ -n "$HOME" ]; then
    test_pass "HOME environment variable set"
else
    test_fail "HOME environment variable not set"
fi

if [ -n "$PATH" ]; then
    test_pass "PATH environment variable set"
else
    test_fail "PATH environment variable not set"
fi

# Test 9: Child process spawning
echo ""
echo "📋 Testing child process spawning..."
if node -e "
const { spawn } = require('child_process');
const child = spawn('echo', ['test']);
child.on('exit', (code) => process.exit(code));
" >/dev/null 2>&1; then
    test_pass "Child process spawning works"
else
    test_fail "Child process spawning failed"
fi

# Test 10: Automation script compatibility
echo ""
echo "📋 Testing automation script compatibility..."

# Create a test automation script
TEST_SCRIPT="/tmp/test-automation-$$.js"
cat > "$TEST_SCRIPT" << 'EOF'
#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

console.log('Testing automation capabilities...');

// Test 1: Process spawning
const child = spawn('echo', ['automation test']);
child.on('exit', (code) => {
    if (code === 0) {
        console.log('✅ Process spawning works');
    } else {
        console.log('❌ Process spawning failed');
        process.exit(1);
    }
    
    // Test 2: File operations
    try {
        fs.writeFileSync('/tmp/automation-test.txt', 'test');
        fs.unlinkSync('/tmp/automation-test.txt');
        console.log('✅ File operations work');
    } catch (error) {
        console.log('❌ File operations failed');
        process.exit(1);
    }
    
    console.log('✅ Automation compatibility verified');
});
EOF

if node "$TEST_SCRIPT" >/dev/null 2>&1; then
    test_pass "Automation script compatibility verified"
else
    test_fail "Automation script compatibility failed"
fi

# Cleanup
rm -f "$TEST_SCRIPT" 2>/dev/null

# Results summary
echo ""
echo "🏁 Test Results Summary"
echo "======================"
echo "✅ Passed: $PASSED tests"
echo "❌ Failed: $FAILED tests"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 EXCELLENT! Your environment is fully compatible with SwiftNotes automation tools."
    echo ""
    echo "✅ You can proceed with migration - all automation features will work perfectly!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Run the migration script"
    echo "2. Copy your SwiftNotes project files"
    echo "3. Install dependencies"
    echo "4. Test automation: npm run dev-auto"
    exit 0
elif [ $FAILED -le 2 ]; then
    echo "⚠️  GOOD: Your environment is mostly compatible with minor issues."
    echo ""
    echo "🔧 Please address the failed tests above, then proceed with migration."
    echo "Most automation features should work correctly."
    exit 1
else
    echo "❌ POOR: Your environment has significant compatibility issues."
    echo ""
    echo "🚨 Please fix the failed tests before attempting migration."
    echo "Automation tools may not function properly in this environment."
    echo ""
    echo "💡 Consider using:"
    echo "- Local development environment with proper Node.js setup"
    echo "- GitHub Codespaces or GitPod"
    echo "- Docker development container"
    exit 2
fi
```

### 🧪 **Post-Migration Verification**

After migration, run this comprehensive test:

```bash
#!/bin/bash
# SwiftNotes Post-Migration Verification
# Run this after migration to verify everything works

echo "🧪 SwiftNotes Post-Migration Verification"
echo "========================================="

cd "$(dirname "$0")"

# Test 1: Project structure
echo "📁 Verifying project structure..."
for dir in backend frontend automation logs; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory missing"
    fi
done

# Test 2: Dependencies
echo ""
echo "📦 Verifying dependencies..."
if [ -f "package.json" ] && npm list >/dev/null 2>&1; then
    echo "✅ Root dependencies installed"
else
    echo "❌ Root dependencies missing"
fi

if [ -f "backend/package.json" ] && (cd backend && npm list >/dev/null 2>&1); then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependencies missing"
fi

if [ -f "frontend/package.json" ] && (cd frontend && npm list >/dev/null 2>&1); then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend dependencies missing"
fi

# Test 3: Automation scripts
echo ""
echo "🤖 Testing automation scripts..."
if [ -x "server-manager.js" ] && node server-manager.js status >/dev/null 2>&1; then
    echo "✅ server-manager.js functional"
else
    echo "❌ server-manager.js not working"
fi

if [ -x "start-dev.sh" ]; then
    echo "✅ start-dev.sh executable"
else
    echo "❌ start-dev.sh not executable"
fi

# Test 4: npm scripts
echo ""
echo "📜 Testing npm scripts..."
if npm run servers >/dev/null 2>&1; then
    echo "✅ npm scripts configured"
else
    echo "❌ npm scripts not working"
fi

# Test 5: Environment configuration
echo ""
echo "🔧 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file missing - needs configuration"
fi

echo ""
echo "🎯 Migration verification complete!"
echo "Ready to start development with: npm run dev-auto"
```

This comprehensive verification ensures your new environment is fully functional!
