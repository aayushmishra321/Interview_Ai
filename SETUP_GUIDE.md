# Smart Interview AI - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd smart-interview-ai

# Run the setup script
# On Windows:
start-dev.bat

# On macOS/Linux:
./start-dev.sh
```

### 2. Access the Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5001
- **AI Server**: http://localhost:8000

## 🔧 Manual Setup (If Automated Script Fails)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

### AI Server Setup
```bash
cd ai-server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start server
python src/main.py
```

## 🔑 API Keys Configuration

Your `.env` file is already configured with the following services:

### ✅ Already Configured
- **MongoDB Atlas** - Database connection
- **JWT Secrets** - Authentication tokens
- **Auth0** - Social authentication
- **Google Gemini AI** - Primary AI engine
- **Cloudinary** - File storage and media processing
- **AssemblyAI** - Speech recognition
- **Deepgram** - Advanced speech processing
- **EmailJS** - Email notifications

### 🔄 Optional Enhancements
If you want to add more services, update these in `.env`:

```env
# AWS (Optional - for additional file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Sentry (Optional - for error monitoring)
SENTRY_DSN=your-sentry-dsn

# Analytics (Optional)
ANALYTICS_API_KEY=your-analytics-key
```

## 🧪 Testing the Setup

### 1. Health Checks
Visit these URLs to verify services are running:
- Backend Health: http://localhost:5001/health
- AI Server Health: http://localhost:8000/health

### 2. API Testing
```bash
# Test backend API
curl http://localhost:5001/health

# Test AI server
curl http://localhost:8000/health
```

### 3. Frontend Testing
1. Open http://localhost:5174
2. Click "Sign up for free"
3. Use Google OAuth or create an account
4. Complete the onboarding process
5. Start a mock interview

## 🎯 Key Features to Test

### Authentication
- ✅ Google OAuth login
- ✅ Traditional email/password signup
- ✅ Password reset functionality

### Interview System
- ✅ Resume upload and analysis
- ✅ AI question generation
- ✅ Real-time video/audio recording
- ✅ Speech recognition
- ✅ Emotion detection
- ✅ Comprehensive feedback

### AI Features
- ✅ Google Gemini AI integration
- ✅ Dynamic question generation
- ✅ Response analysis
- ✅ Personalized feedback

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows - Kill process on port
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# macOS/Linux - Kill process on port
lsof -ti :5174 | xargs kill -9
```

#### Python Virtual Environment Issues
```bash
# Delete and recreate virtual environment
rm -rf ai-server/venv  # or rmdir /s ai-server\venv on Windows
cd ai-server
python -m venv venv
```

#### Node.js Module Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
- Verify MongoDB Atlas connection string in `.env`
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network connectivity

### Service-Specific Issues

#### Frontend (Port 5174)
- Check if Vite is properly configured
- Verify all dependencies are installed
- Check browser console for errors

#### Backend (Port 5001)
- Verify MongoDB connection
- Check if all environment variables are set
- Review backend logs for errors

#### AI Server (Port 8000)
- Ensure Python virtual environment is activated
- Verify all Python packages are installed
- Check if spaCy model is downloaded

## 📊 Monitoring and Logs

### Log Locations
- **Backend Logs**: `backend/logs/`
- **Frontend Logs**: Browser console
- **AI Server Logs**: Terminal output

### Health Monitoring
- Backend: http://localhost:5001/health
- AI Server: http://localhost:8000/health

## 🔒 Security Notes

### Development Environment
- All secrets are configured for development
- CORS is enabled for localhost
- Debug mode is enabled

### Production Deployment
- Update all API keys and secrets
- Configure proper CORS origins
- Enable HTTPS
- Set up proper logging and monitoring

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/refresh      - Refresh JWT token
POST /api/auth/logout       - User logout
```

### Interview Endpoints
```
POST /api/interview/create  - Create new interview
POST /api/interview/:id/start - Start interview session
POST /api/interview/:id/end - End interview session
GET  /api/interview/history - Get user's interview history
```

### AI Processing Endpoints
```
POST /api/ai/generate-questions - Generate interview questions
POST /api/ai/analyze-response   - Analyze user response
POST /api/ai/generate-feedback  - Generate comprehensive feedback
```

## 🎓 Usage Guide

### For Developers
1. **Frontend Development**: React + TypeScript + Tailwind CSS
2. **Backend Development**: Node.js + Express + MongoDB
3. **AI Development**: Python + FastAPI + Google Gemini

### For Users
1. **Sign Up**: Create account or use Google OAuth
2. **Upload Resume**: AI analyzes skills and experience
3. **Start Interview**: Choose type and difficulty
4. **Get Feedback**: Comprehensive analysis and recommendations

## 🚀 Deployment

### Development
```bash
# Start all services
start-dev.bat  # Windows
./start-dev.sh # macOS/Linux
```

### Production
```bash
# Build all services
npm run build
cd backend && npm run build
cd ../ai-server && pip install -r requirements.txt

# Start production servers
npm start
cd backend && npm start
cd ../ai-server && python src/main.py
```

## 📞 Support

If you encounter any issues:

1. **Check the logs** in respective service directories
2. **Verify API keys** are correctly configured
3. **Ensure all services** are running on correct ports
4. **Check network connectivity** for external services

## 🎉 Success!

If everything is working correctly, you should see:
- ✅ Frontend loading at http://localhost:5174
- ✅ Backend API responding at http://localhost:5001
- ✅ AI Server processing at http://localhost:8000
- ✅ Authentication working with Auth0
- ✅ AI features powered by Google Gemini
- ✅ File uploads working with Cloudinary
- ✅ Database operations with MongoDB Atlas

**You now have a fully functional Smart Interview AI platform!** 🎊