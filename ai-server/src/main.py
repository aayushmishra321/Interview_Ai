from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os
from dotenv import load_dotenv
from loguru import logger

# Import services
from services.gemini_service import GeminiService
from services.audio_analysis import AudioAnalysisService
from services.video_analysis import VideoAnalysisService
from services.speech_recognition import SpeechRecognitionService
from services.emotion_detection import EmotionDetectionService
from services.resume_parser import ResumeParserService

# Import models
from models.analysis_models import (
    AudioAnalysisRequest,
    VideoAnalysisRequest,
    SpeechAnalysisRequest,
    EmotionAnalysisRequest,
    ResumeAnalysisRequest,
    InterviewAnalysisRequest
)

# Load environment variables
load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Interview AI - ML Server",
    description="AI/ML processing server for Smart Interview AI platform",
    version="1.0.0"
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",  # Frontend
        "http://localhost:5001",  # Backend
        os.getenv("FRONTEND_URL", "http://localhost:5174"),
        os.getenv("BACKEND_URL", "http://localhost:5001")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize services
gemini_service = GeminiService()
audio_service = AudioAnalysisService()
video_service = VideoAnalysisService()
speech_service = SpeechRecognitionService()
emotion_service = EmotionDetectionService()
resume_service = ResumeParserService()

# Dependency for authentication
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the API token"""
    expected_token = os.getenv("API_KEY") or os.getenv("PYTHON_AI_SERVER_API_KEY")
    if not expected_token:
        logger.error("API_KEY not configured in environment")
        raise HTTPException(status_code=500, detail="Server configuration error")
    
    if credentials.credentials != expected_token:
        logger.warning(f"Invalid authentication attempt from token: {credentials.credentials[:10]}...")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    return credentials.credentials

# File size validator
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB default

async def validate_file_size(file: UploadFile):
    """Validate uploaded file size"""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    await file.seek(0)  # Reset file pointer
    return file

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Smart Interview AI - ML Server",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "gemini": await gemini_service.health_check(),
            "audio": audio_service.health_check(),
            "video": video_service.health_check(),
            "speech": speech_service.health_check(),
            "emotion": emotion_service.health_check(),
            "resume": resume_service.health_check()
        }
    }

# Audio Analysis Endpoints
@app.post("/api/audio/analyze")
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute
async def analyze_audio(
    request: Request,
    audio_request: AudioAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze audio for speech patterns, pace, and quality"""
    try:
        result = await audio_service.analyze_audio(
            audio_data=audio_request.audio_data,
            sample_rate=audio_request.sample_rate,
            duration=audio_request.duration
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Audio analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/speech-to-text")
@limiter.limit("20/minute")  # Rate limit: 20 requests per minute
async def speech_to_text(
    request: Request,
    audio_file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """Convert speech to text using Whisper"""
    try:
        # Validate file size
        await validate_file_size(audio_file)
        
        audio_data = await audio_file.read()
        result = await speech_service.transcribe_audio(audio_data)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/filler-words")
async def detect_filler_words(
    request: SpeechAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Detect filler words in speech"""
    try:
        result = await audio_service.detect_filler_words(
            transcript=request.transcript,
            audio_timestamps=request.timestamps
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Filler words detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Video Analysis Endpoints
@app.post("/api/video/analyze-frame")
async def analyze_video_frame(
    video_file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """Analyze a single video frame for facial features and emotions"""
    try:
        frame_data = await video_file.read()
        result = await video_service.analyze_frame(frame_data)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Video frame analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/eye-contact")
async def analyze_eye_contact(
    request: VideoAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze eye contact patterns in video"""
    try:
        result = await video_service.analyze_eye_contact(
            video_data=request.video_data,
            duration=request.duration
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Eye contact analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/posture")
async def analyze_posture(
    request: VideoAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze posture and body language"""
    try:
        result = await video_service.analyze_posture(
            video_data=request.video_data,
            duration=request.duration
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Posture analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Emotion Detection Endpoints
@app.post("/api/emotion/analyze")
async def analyze_emotions(
    request: EmotionAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze emotions from facial expressions"""
    try:
        result = await emotion_service.analyze_emotions(
            image_data=request.image_data,
            timestamp=request.timestamp
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emotion/batch-analyze")
async def batch_analyze_emotions(
    video_file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """Analyze emotions throughout an entire video"""
    try:
        video_data = await video_file.read()
        result = await emotion_service.batch_analyze_video(video_data)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Batch emotion analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Resume Processing Endpoints
@app.post("/api/resume/parse")
@limiter.limit("10/minute")  # Rate limit: 10 requests per minute
async def parse_resume(
    request: Request,
    resume_file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """Parse resume and extract structured information"""
    try:
        # Validate file size
        await validate_file_size(resume_file)
        
        # Validate file type
        allowed_types = ['application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if resume_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only PDF and DOC files are allowed"
            )
        
        file_data = await resume_file.read()
        result = await resume_service.parse_resume(
            file_data=file_data,
            filename=resume_file.filename
        )
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/analyze")
async def analyze_resume(
    request: ResumeAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze resume content using AI"""
    try:
        result = await gemini_service.analyze_resume(
            resume_text=request.resume_text,
            target_role=request.target_role
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Resume analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Question Generation Endpoints
@app.post("/api/ai/generate-questions")
@limiter.limit("20/minute")  # Rate limit: 20 requests per minute
async def generate_questions(
    request: Request,
    question_request: dict,
    token: str = Depends(verify_token)
):
    """Generate interview questions using Gemini AI"""
    try:
        result = await gemini_service.generate_interview_questions(question_request)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Question generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/analyze-response")
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute
async def analyze_response(
    request: Request,
    response_request: dict,
    token: str = Depends(verify_token)
):
    """Analyze interview response using Gemini AI"""
    try:
        result = await gemini_service.analyze_response(response_request)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Response analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/generate-feedback")
@limiter.limit("15/minute")  # Rate limit: 15 requests per minute
async def generate_feedback(
    request: Request,
    feedback_request: dict,
    token: str = Depends(verify_token)
):
    """Generate comprehensive feedback using Gemini AI"""
    try:
        result = await gemini_service.generate_feedback(feedback_request)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Feedback generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Comprehensive Analysis Endpoint
@app.post("/api/analysis/comprehensive")
async def comprehensive_analysis(
    request: InterviewAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Perform comprehensive analysis of interview data"""
    try:
        # Combine all analysis services
        results = {}
        
        # Audio analysis
        if request.audio_data:
            results["audio"] = await audio_service.analyze_audio(
                audio_data=request.audio_data,
                sample_rate=request.sample_rate or 44100,
                duration=request.duration
            )
        
        # Video analysis
        if request.video_data:
            results["video"] = await video_service.analyze_comprehensive(
                video_data=request.video_data,
                duration=request.duration
            )
        
        # Emotion analysis
        if request.video_data:
            results["emotions"] = await emotion_service.batch_analyze_video(
                request.video_data
            )
        
        # AI-powered content analysis
        if request.responses:
            results["content"] = await gemini_service.analyze_interview_content(
                responses=request.responses,
                questions=request.questions,
                role=request.role
            )
        
        # Generate overall score and feedback
        results["overall"] = await gemini_service.generate_comprehensive_feedback({
            "analysis_results": results,
            "interview_data": request.dict(),
            "user_profile": request.user_profile
        })
        
        return {"success": True, "data": results}
    except Exception as e:
        logger.error(f"Comprehensive analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )