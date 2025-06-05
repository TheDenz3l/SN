# SwiftNotes Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Validation Failed Errors (400 Status)

**Symptoms:**
- Console shows "Validation failed" errors
- Setup completion fails
- API requests return 400 status codes

**Root Causes:**
- Backend server not running
- Authentication token mismatch
- Database foreign key constraints

**Solutions:**

#### Step 1: Start Backend Server
```bash
# Option A: Use the fix script (recommended)
node fix-and-start.js

# Option B: Manual start
cd backend
npm install
node server.js
```

#### Step 2: Verify Backend Health
```bash
# Check if backend is running
curl http://localhost:3001/health

# Should return:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

#### Step 3: Apply Database Fixes
```bash
# Run the SQL fix file in Supabase
# Copy contents of fix-templates-foreign-key.sql
# Paste into Supabase SQL Editor and execute
```

### 2. Authentication Issues

**Symptoms:**
- "User not authenticated" errors
- Login fails with valid credentials
- Token expired messages

**Solutions:**

#### Clear Browser Storage
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
```

#### Use Correct Authentication Flow
```javascript
// Frontend should use authService.ts, not direct Supabase calls
import { login, register } from './services/authService';

// Login
const result = await login({ email, password });
if (result.success) {
  // User is authenticated
}
```

### 3. Backend Server Issues

**Symptoms:**
- "Backend server not running" errors
- Connection refused errors
- Port 3001 not accessible

**Solutions:**

#### Check Port Availability
```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

#### Kill Existing Processes
```bash
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

#### Environment Variables
Create `.env` file in backend directory:
```env
SUPABASE_URL=https://ppavdpzulvosmmkzqtgy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
NODE_ENV=development
PORT=3001
```

### 4. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Foreign key constraint violations
- Table not found errors

**Solutions:**

#### Apply Foreign Key Fixes
```sql
-- Run in Supabase SQL Editor
-- Copy entire contents of fix-templates-foreign-key.sql
```

#### Verify Database Schema
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check foreign key constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

### 5. Frontend Build Issues

**Symptoms:**
- TypeScript errors
- Import/export errors
- Component not rendering

**Solutions:**

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Check TypeScript Configuration
```bash
# Verify TypeScript compilation
npx tsc --noEmit
```

#### Clear Build Cache
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 🔧 Quick Fix Commands

### Complete Reset and Restart
```bash
# 1. Stop all processes
# Press Ctrl+C in all terminals

# 2. Clear browser storage
# In browser console: localStorage.clear()

# 3. Restart backend
node fix-and-start.js

# 4. Restart frontend (in new terminal)
cd frontend
npm run dev
```

### Database Reset (if needed)
```bash
# Run comprehensive verification
node comprehensive-phase3-verification.js

# Apply fixes if needed
node fix-and-start.js
```

## 📊 Health Check Commands

### Backend Health
```bash
curl http://localhost:3001/health
```

### API Endpoints Test
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
```

### Database Verification
```bash
node comprehensive-phase3-verification.js
```

## 🆘 Emergency Recovery

If nothing works, follow these steps:

1. **Complete Environment Reset**
   ```bash
   # Stop all processes
   # Clear browser storage
   # Delete node_modules in both frontend and backend
   # Reinstall everything
   ```

2. **Database Recovery**
   ```bash
   # Apply the foreign key fixes
   # Run verification script
   # Check Supabase dashboard for errors
   ```

3. **Contact Support**
   - Provide error logs from browser console
   - Include backend server logs
   - Share environment details (OS, Node version, etc.)

## 📝 Logging and Debugging

### Enable Debug Logging
```bash
# Backend
DEBUG=* node server.js

# Frontend
# Open browser dev tools
# Check Console and Network tabs
```

### Common Log Locations
- Browser Console: F12 → Console
- Backend Logs: Terminal where server.js is running
- Supabase Logs: Supabase Dashboard → Logs

## ✅ Success Indicators

You know everything is working when:
- ✅ Backend health check returns 200
- ✅ Frontend can authenticate users
- ✅ Database operations succeed
- ✅ No console errors
- ✅ Setup completion works
