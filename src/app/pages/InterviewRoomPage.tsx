import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Clock, 
  User, 
  MessageSquare,
  Camera,
  Mic,
  Settings,
  ChevronLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/Card';
import { AIAvatar } from '../components/interview/AIAvatar';
import { VideoRecorder } from '../components/interview/VideoRecorder';
import { SpeechRecognition } from '../components/interview/SpeechRecognition';
import { useInterviewStore } from '../stores/interviewStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export function InterviewRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get('id');

  const { user } = useAuthStore();
  const {
    currentInterview,
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    isRecording,
    isLoading,
    error,
    startInterview,
    endInterview,
    getNextQuestion,
    submitResponse,
    startRecording,
    stopRecording,
    clearError,
  } = useInterviewStore();

  const [sessionState, setSessionState] = useState<'setup' | 'active' | 'paused' | 'ended'>('setup');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState === 'active') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState]);

  // Initialize interview
  useEffect(() => {
    console.log('=== INTERVIEW ROOM INITIALIZATION ===');
    console.log('Interview ID from URL:', interviewId);
    console.log('Current Interview:', currentInterview);
    console.log('Current Session:', currentSession);
    
    if (!interviewId) {
      console.error('No interview ID in URL');
      toast.error('No interview ID provided. Redirecting to setup...');
      navigate('/interview-setup');
      return;
    }

    // If we have an interview ID but no session, start the interview
    if (interviewId && !currentSession) {
      console.log('Starting interview with ID:', interviewId);
      handleStartInterview();
    }
  }, [interviewId]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleStartInterview = async () => {
    if (!interviewId) {
      toast.error('No interview ID provided');
      navigate('/interview-setup');
      return;
    }

    try {
      await startInterview(interviewId);
      setSessionState('active');
      setIsAISpeaking(true);
      setResponseStartTime(Date.now());
      
      // Simulate AI speaking the question
      setTimeout(() => {
        setIsAISpeaking(false);
        setIsListening(true);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      toast.error('Failed to start interview');
    }
  };

  const handleEndInterview = async () => {
    try {
      await endInterview();
      setSessionState('ended');
      toast.success('Interview completed!');
      
      // Navigate to feedback page
      if (currentInterview) {
        // Handle both _id and id
        const interviewId = (currentInterview as any)._id || currentInterview.id;
        navigate(`/feedback?id=${interviewId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to end interview:', error);
      toast.error('Failed to end interview');
      navigate('/dashboard');
    }
  };

  const handleNextQuestion = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer before continuing');
      return;
    }

    if (!currentQuestion || !responseStartTime) {
      toast.error('No active question');
      return;
    }

    try {
      // Calculate response duration
      const duration = Math.round((Date.now() - responseStartTime) / 1000);

      // Submit response
      await submitResponse({
        questionId: currentQuestion.id,
        answer: currentAnswer,
        duration,
        timestamp: new Date(),
      });

      // Clear answer and reset
      setCurrentAnswer('');
      setIsAISpeaking(true);
      setIsListening(false);
      
      // Simulate AI speaking next question
      setTimeout(() => {
        setIsAISpeaking(false);
        setIsListening(true);
        setResponseStartTime(Date.now());
      }, 2000);

      toast.success('Response submitted!');
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      toast.error('Failed to submit response');
    }
  };

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setCurrentAnswer(prev => prev + ' ' + transcript);
    }
  };

  const handleStartListening = () => {
    setIsListening(true);
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Interview Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={clearError} variant="outline" className="flex-1">
              Retry
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="primary" className="flex-1">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading && !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Exit
            </Button>
            
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">{user?.profile.firstName} {user?.profile.lastName}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              Question {currentQuestionIndex} of {currentInterview?.questions?.length || 0}
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              sessionState === 'active' 
                ? 'bg-green-100 text-green-800' 
                : sessionState === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {sessionState === 'active' ? 'Live' : sessionState === 'paused' ? 'Paused' : 'Setup'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - AI Interviewer */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold">AI Interviewer</h2>
              </div>
              
              <div className="flex-1 relative">
                <AIAvatar
                  isListening={isListening}
                  isSpeaking={isAISpeaking}
                  emotion="professional"
                  className="h-full"
                />
              </div>

              {/* Current Question */}
              {currentQuestion && sessionState !== 'setup' && (
                <div className="p-4 border-t border-border">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Current Question:</h3>
                    <p className="text-blue-800">{currentQuestion.text}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                      <span className="px-2 py-1 bg-blue-100 rounded">{currentQuestion.type}</span>
                      <span className="px-2 py-1 bg-blue-100 rounded">{currentQuestion.difficulty}</span>
                      <span className="px-2 py-1 bg-blue-100 rounded">{currentQuestion.expectedDuration} min</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!currentQuestion && sessionState === 'active' && (
                <div className="p-4 border-t border-border">
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-yellow-800">No more questions available</p>
                    <Button onClick={handleEndInterview} variant="primary" className="mt-2">
                      End Interview
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Center Panel - Video & Controls */}
          <div className="lg:col-span-1">
            <div className="space-y-4 h-full flex flex-col">
              {/* Video Recorder */}
              <div className="flex-1">
                <VideoRecorder
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  className="h-full"
                />
              </div>

              {/* Interview Controls */}
              <Card className="p-4">
                <div className="flex items-center justify-center gap-3">
                  {sessionState === 'setup' && (
                    <Button
                      onClick={handleStartInterview}
                      variant="primary"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Interview
                    </Button>
                  )}

                  {sessionState === 'active' && (
                    <>
                      <Button
                        onClick={() => setSessionState('paused')}
                        variant="outline"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={handleNextQuestion}
                        variant="primary"
                        disabled={!currentAnswer.trim()}
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Next Question
                      </Button>

                      <Button
                        onClick={handleEndInterview}
                        variant="destructive"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}

                  {sessionState === 'paused' && (
                    <Button
                      onClick={() => setSessionState('active')}
                      variant="primary"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Right Panel - Speech Recognition & Answer */}
          <div className="lg:col-span-1">
            <div className="space-y-4 h-full flex flex-col">
              {/* Speech Recognition */}
              <div className="flex-1">
                <SpeechRecognition
                  isListening={isListening}
                  onStartListening={handleStartListening}
                  onStopListening={handleStopListening}
                  onTranscript={handleTranscript}
                  className="h-full"
                />
              </div>

              {/* Answer Input */}
              <Card className="p-4">
                <h3 className="font-medium mb-3">Your Answer</h3>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Your answer will appear here as you speak, or you can type directly..."
                  className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                  <span>{currentAnswer.length} characters</span>
                  <span>{currentAnswer.split(' ').filter(word => word.length > 0).length} words</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel (Hidden by default) */}
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}