# Smart Interview AI - System Architecture

## Overview
Smart Interview AI is a comprehensive SaaS platform that uses advanced AI to conduct realistic interview simulations with real-time feedback and analysis.

## System Architecture

### Frontend Architecture (React + TypeScript)
```
src/
├── app/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── interview/       # Interview-specific components
│   │   ├── dashboard/       # Dashboard components
│   │   └── common/          # Common components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── stores/              # Zustand state management
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── styles/                  # CSS and styling
└── assets/                  # Static assets
```

### Backend Architecture (Node.js + Express)
```
backend/
├── src/
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── config/              # Configuration
├── uploads/                 # File uploads
└── logs/                    # Application logs
```

### AI/ML Server Architecture (Python + FastAPI)
```
ai-server/
├── src/
│   ├── api/                 # FastAPI routes
│   ├── models/              # AI model handlers
│   ├── services/            # AI processing services
│   ├── utils/               # Utility functions
│   └── config/              # Configuration
├── models/                  # Trained models
└── temp/                    # Temporary files
```

## Core Features & Components

### 1. Authentication & User Management
- JWT-based authentication
- OAuth integration (Google)
- Role-based access control
- User profile management

### 2. Resume Analysis Engine
- PDF/DOC parsing
- Skill extraction using NLP
- Experience level assessment
- Job role matching

### 3. AI Interview Engine
- **Google Gemini Integration** (Primary AI)
- Dynamic question generation
- Context-aware follow-up questions
- Multi-modal analysis (text, audio, video)

### 4. Real-time Communication
- WebRTC for video/audio
- Socket.io for real-time updates
- Three.js for AI avatar
- Speech recognition integration

### 5. Analysis & Feedback System
- **Video Analysis:**
  - Eye contact tracking
  - Facial expression analysis
  - Head movement detection
  - Posture assessment

- **Audio Analysis:**
  - Speech-to-text conversion
  - Pace and rhythm analysis
  - Filler word detection
  - Tone analysis

- **Content Analysis:**
  - Answer relevance scoring
  - Technical accuracy assessment
  - Communication clarity
  - Confidence indicators

### 6. Reporting & Analytics
- Comprehensive feedback reports
- Performance tracking
- Skill improvement roadmaps
- PDF report generation

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **State Management:** Zustand
- **Routing:** React Router v7
- **3D Graphics:** Three.js + React Three Fiber
- **Charts:** Recharts + Chart.js
- **Code Editor:** Monaco Editor
- **WebRTC:** Simple Peer
- **Real-time:** Socket.io Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT + Passport.js
- **File Upload:** Multer + Cloudinary
- **Real-time:** Socket.io
- **Email:** EmailJS
- **Validation:** Joi

### AI/ML Server
- **Framework:** FastAPI
- **AI Engine:** Google Gemini API
- **Speech Processing:** Whisper/Deepgram
- **Computer Vision:** OpenCV + MediaPipe
- **NLP:** spaCy + NLTK
- **Audio Analysis:** Librosa
- **Face Analysis:** DeepFace

### Infrastructure
- **Database:** MongoDB Atlas
- **File Storage:** Cloudinary + AWS S3
- **Caching:** Redis
- **Deployment:** Docker + AWS/Vercel
- **Monitoring:** Sentry

## API Design

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-otp
```

### User Management
```
GET /api/user/profile
PUT /api/user/profile
POST /api/user/upload-avatar
DELETE /api/user/account
```

### Resume Management
```
POST /api/resume/upload
GET /api/resume/analyze/:id
PUT /api/resume/update/:id
DELETE /api/resume/:id
```

### Interview System
```
POST /api/interview/start
POST /api/interview/process
POST /api/interview/end
GET /api/interview/history
GET /api/interview/:id
```

### Feedback & Reports
```
GET /api/feedback/:interviewId
POST /api/feedback/generate
GET /api/report/:id/pdf
GET /api/analytics/dashboard
```

### Admin Endpoints
```
GET /api/admin/stats
GET /api/admin/users
GET /api/admin/interviews
PUT /api/admin/user/:id
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // hashed
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String,
    location: String
  },
  preferences: {
    role: String,
    experienceLevel: String,
    industries: [String],
    interviewTypes: [String]
  },
  subscription: {
    plan: String,
    status: String,
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Resumes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  filename: String,
  fileUrl: String,
  analysis: {
    skills: [String],
    experience: Number,
    education: [Object],
    certifications: [String],
    summary: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Interviews Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  resumeId: ObjectId,
  type: String, // 'behavioral', 'technical', 'coding'
  status: String, // 'scheduled', 'in-progress', 'completed'
  settings: {
    role: String,
    difficulty: String,
    duration: Number
  },
  questions: [Object],
  responses: [Object],
  analysis: {
    videoMetrics: Object,
    audioMetrics: Object,
    contentMetrics: Object,
    overallScore: Number
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    recommendations: [String],
    detailedFeedback: String
  },
  createdAt: Date,
  completedAt: Date
}
```

## AI Processing Pipeline

### 1. Resume Processing
```
PDF/DOC Upload → Text Extraction → NLP Analysis → Skill Extraction → Job Matching
```

### 2. Question Generation
```
Resume Analysis + Role Selection → Gemini API → Dynamic Questions → Context Storage
```

### 3. Real-time Interview Analysis
```
Video Stream → Face Detection → Emotion Analysis
Audio Stream → Speech-to-Text → Content Analysis
Combined Data → Real-time Scoring → Feedback Generation
```

### 4. Post-Interview Processing
```
Session Data → Comprehensive Analysis → Gemini Feedback → Report Generation → PDF Export
```

## Security Considerations

- JWT token rotation
- Rate limiting on all endpoints
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Environment variable protection
- Database connection security
- API key management

## Performance Optimization

- Redis caching for frequent queries
- CDN for static assets
- Database indexing
- Lazy loading for components
- WebRTC optimization
- AI model caching
- Compression for file uploads

## Deployment Strategy

### Development
- Local MongoDB instance
- Local Redis server
- Environment-specific configs

### Production
- MongoDB Atlas cluster
- Redis Cloud instance
- AWS S3 for file storage
- Docker containerization
- Load balancing
- Auto-scaling configuration

This architecture ensures scalability, maintainability, and optimal performance for the Smart Interview AI platform.