# SwiftNotes - AI-Powered Note-Taking Application

## 🚀 **Automated Development Environment**

SwiftNotes is a comprehensive AI-powered note-taking application with **complete automation support** for seamless development workflow.

### ✨ **Key Features**

- **🤖 AI-Powered Writing**: Google AI integration for intelligent note generation
- **📊 Analytics Dashboard**: Comprehensive writing analytics and insights  
- **🔍 OCR Integration**: Extract text from images with intelligent formatting
- **📝 ISP (Intelligent Structured Planning)**: Advanced note organization
- **🎨 Tone Customization**: Personalized writing style adaptation
- **🔐 Secure Authentication**: Supabase-powered user management
- **📱 Responsive Design**: Modern React/TypeScript frontend

### 🛠 **Technology Stack**

**Backend:**
- Node.js + Express API server
- Supabase database and authentication
- Google AI API integration
- OCR processing capabilities

**Frontend:**
- React 19 + TypeScript
- Vite build system
- Tailwind CSS styling
- Real-time updates

**Automation:**
- Complete server management automation
- Process monitoring and health checks
- Automated startup/shutdown scripts
- Development workflow optimization

## 🚀 **Quick Start (Automated)**

### **Prerequisites**
- Node.js >=18.0.0
- npm >=9.0.0
- Git

### **Installation**

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/SwiftNotes.git
cd SwiftNotes

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development environment
npm run dev-auto
```

### **🎯 Expected Result**

```
🚀 Starting SwiftNotes Development Environment...
🔧 Starting backend server...
✅ Backend started successfully on http://localhost:3001
🎨 Starting frontend server...
✅ Frontend started successfully on http://localhost:5173

🎉 SwiftNotes Development Environment Ready!
🌐 Frontend: http://localhost:5173
🔧 Backend: http://localhost:3001
📊 Health: http://localhost:3001/health
```

## 📋 **Automation Commands**

### **Development Workflow**
```bash
npm run dev-auto    # Start both servers automatically
npm run stop        # Stop all servers cleanly
npm run status      # Check server status
npm run health      # Test backend connectivity
npm run servers     # Show all available commands
```

### **Alternative Commands**
```bash
npm run dev-shell   # Start using shell scripts
npm run stop-shell  # Stop using shell scripts
./start-dev.sh      # Direct shell script execution
./stop-dev.sh       # Direct shutdown script
node server-manager.js start  # Direct Node.js automation
```

## 🔧 **Environment Configuration**

### **Required Environment Variables**

Create `.env` file with these values:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI API Key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Environment Settings
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### **Getting API Keys**

1. **Supabase**: Create project at https://supabase.com
2. **Google AI**: Get API key from https://makersuite.google.com/app/apikey

## 📁 **Project Structure**

```
SwiftNotes/
├── backend/                 # Node.js API server
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── vite.config.ts     # Vite configuration
├── automation/            # Server management
│   ├── server-manager.js  # Node.js automation
│   ├── start-dev.sh      # Shell automation
│   └── stop-dev.sh       # Cleanup scripts
├── monitoring/            # Grafana/Prometheus
├── logs/                  # Application logs
└── docs/                  # Documentation
```

## 🧪 **Testing & Verification**

### **Health Checks**
```bash
# Test backend
curl http://localhost:3001/health

# Test frontend
curl http://localhost:5173

# Check server status
npm run status
```

### **Development URLs**
- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api/docs

## 🔄 **Development Workflow**

### **Daily Development**
1. `npm run dev-auto` - Start development environment
2. Make your code changes
3. Servers auto-reload on file changes
4. `npm run stop` - Clean shutdown when done

### **Debugging**
- Backend logs: `logs/backend.log`
- Frontend logs: `logs/frontend.log`
- Error logs: `logs/error.log`

## 🚀 **Deployment**

### **Production Build**
```bash
cd frontend
npm run build

cd ../backend
npm start
```

### **Docker Deployment**
```bash
docker-compose up -d
```

## 📚 **Documentation**

- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Setup Instructions**: `SETUP_INSTRUCTIONS.md`
- **Environment Verification**: `ENVIRONMENT_VERIFICATION.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

If you encounter issues:

1. Check the troubleshooting guide: `TROUBLESHOOTING.md`
2. Verify environment setup: `ENVIRONMENT_VERIFICATION.md`
3. Review logs in `logs/` directory
4. Open an issue on GitHub

---

**🎉 SwiftNotes - Where AI meets productivity with automated development workflow!**
