# 🎯 Smart Interview AI Platform

An AI-powered interview preparation platform that provides realistic interview practice with real-time feedback, video/audio analysis, and personalized recommendations.

![Platform Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Features

### Core Features
- 🤖 **AI-Powered Interviews** - Practice with AI interviewer using Gemini AI
- 📄 **Resume Analysis** - Upload resume and get AI-powered insights
- 🎥 **Video Analysis** - Real-time emotion detection, eye contact tracking, posture analysis
- 🎤 **Audio Analysis** - Speech rate, filler words, tone analysis
- 💻 **Coding Interviews** - Live coding with 13+ programming languages
- 📊 **Detailed Feedback** - Comprehensive performance analysis and recommendations
- 👨‍💼 **Admin Dashboard** - User management and system monitoring

### Interview Types
- Behavioral Interviews
- Technical Interviews
- Coding Challenges
- System Design
- HR Rounds

### AI Capabilities
- Resume-based question generation
- Real-time emotion detection
- Eye contact tracking
- Posture analysis
- Speech pattern analysis
- Filler word detection
- Response quality assessment

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Zustand (State Management)
- React Router

**Backend:**
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (Real-time)
- Redis (Caching)

**AI Server:**
- Python + FastAPI
- Google Gemini AI
- MediaPipe (Video Analysis)
- Librosa (Audio Analysis)
- DeepFace (Emotion Detection)
- OpenCV

**Services:**
- Cloudinary (File Storage)
- Stripe (Payments)
- Gmail SMTP (Emails)
- Piston API (Code Execution)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- Redis (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aayushmishra321/Interview_Ai.git
cd Interview_Ai
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
cd ..
```

3. **Install Backend Dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Install AI Server Dependencies**
```bash
cd ai-server
pip install -r requirements.txt
cd ..
```

5. **Configure Environment Variables**

Create `.env` files in frontend, backend, and ai-server directories:

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_NAME=Smart Interview AI
```

**Backend `.env`:**
```env
# Database
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Python AI Server
PYTHON_API_URL=http://localhost:8000
PYTHON_AI_SERVER_API_KEY=your_api_key
```

**AI Server `.env`:**
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=8000
ENVIRONMENT=development
```

6. **Start the Services**

**Option 1 - Use Start Script (Recommended):**
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

**Option 2 - Manual Start:**

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - AI Server:**
```bash
cd ai-server
python src/main.py
```

**Admin Credentials:**
- Email: `admin@smartinterview.ai`
- Password: `Admin123!@#`

---

## 📖 Usage

### For Users

1. **Sign Up** - Create an account at http://localhost:5174/signup
2. **Upload Resume** - Go to Resume Analyzer and upload your resume
3. **Start Interview** - Choose interview type and start practicing
4. **Get Feedback** - Receive detailed AI-powered feedback

### For Admins

1. **Admin Login** - Go to http://localhost:5174/admin/login
2. **Manage Users** - View, edit, and manage user accounts
3. **Monitor System** - Check system health and statistics
4. **View Analytics** - Access platform-wide analytics

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Test Services
- Frontend: http://localhost:5174
- Backend: http://localhost:5001/health
- AI Server: http://localhost:8000/health

---

## 📁 Project Structure

```
Interview_Ai/
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── services/    # API services
│   │   │   ├── stores/      # State management
│   │   │   └── types/       # TypeScript types
│   │   └── styles/          # CSS styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Backend server
│   ├── src/
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── test/            # Test infrastructure
│   ├── logs/                # Application logs
│   ├── package.json
│   └── tsconfig.json
├── ai-server/               # Python AI server
│   ├── src/
│   │   ├── models/          # Data models
│   │   ├── services/        # AI services
│   │   └── main.py          # Entry point
│   └── requirements.txt
├── docker-compose.yml       # Docker configuration
├── start-dev.bat            # Windows start script
├── start-dev.sh             # Linux/Mac start script
├── stop-dev.bat             # Windows stop script
├── stop-dev.sh              # Linux/Mac stop script
└── README.md                # This file
```

---

## 🔑 Key Features Explained

### Resume Analysis
- Upload PDF/DOC resume
- AI extracts skills, experience, education
- Get personalized suggestions
- Questions generated based on resume

### Interview Session
- AI asks questions based on your resume
- Real-time video/audio recording
- Live emotion detection
- Speech pattern analysis
- Instant feedback on responses

### Feedback System
- Overall performance score
- Video metrics (eye contact, posture, emotions)
- Audio metrics (speech rate, filler words, tone)
- Content analysis (relevance, accuracy, clarity)
- Personalized recommendations

### Admin Features
- User management
- System monitoring
- Interview analytics
- Health checks
- Log viewing

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended)
- Secure file uploads

---

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Interview Endpoints
- `POST /api/interview/create` - Create interview
- `POST /api/interview/:id/start` - Start interview
- `POST /api/interview/:id/end` - End interview
- `GET /api/interview/:id/next-question` - Get next question
- `POST /api/interview/:id/response` - Submit response
- `GET /api/interview/history` - Get interview history
- `POST /api/interview/:id/feedback` - Generate feedback

### Resume Endpoints
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume/latest` - Get latest resume
- `GET /api/resume/:id/download` - Download resume
- `DELETE /api/resume/:id` - Delete resume

### Admin Endpoints
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/health` - System health

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Aayush Mishra** - [GitHub](https://github.com/aayushmishra321)

---

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- MediaPipe for video analysis
- DeepFace for emotion detection
- Cloudinary for file storage
- Stripe for payment processing
- shadcn/ui for UI components

---

## 📞 Support

For support, email vikasmishra78000@gmail.com or open an issue on GitHub.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] More interview types
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Interview scheduling
- [ ] Team collaboration features
- [ ] Integration with job boards

---

## 📊 Status

**Current Version:** 1.0.0  
**Status:** Active Development  
**Functionality:** 75% Complete

### What's Working
✅ Authentication & Authorization  
✅ Resume Upload & AI Analysis  
✅ Interview Creation & Management  
✅ AI Question Generation  
✅ Response Analysis & Feedback  
✅ Code Execution (13+ languages)  
✅ Admin Dashboard  
✅ Payment Integration  

### In Progress
⚠️ Real-time Video/Audio Analysis  
⚠️ Emotion Detection  
⚠️ Advanced Analytics  

---

**Made with ❤️ by Aayush Mishra**
