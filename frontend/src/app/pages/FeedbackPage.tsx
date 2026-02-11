import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download, Award, TrendingUp, Eye, Volume2, MessageCircle, Clock, CheckCircle, AlertCircle, Home, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export function FeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  // Support both path parameter (/feedback/:id) and query parameter (?id=)
  const interviewId = paramId || searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    console.log('=== FEEDBACK PAGE MOUNTED ===');
    console.log('Interview ID from URL:', interviewId);
    
    if (interviewId) {
      fetchFeedback();
    } else {
      console.error('No interview ID provided');
      setError('No interview ID provided');
      setLoading(false);
    }
  }, [interviewId]);

  const fetchFeedback = async () => {
    setLoading(true);
    console.log('Fetching feedback for interview:', interviewId);
    
    try {
      // First, fetch interview data
      console.log('Fetching interview data...');
      const interviewResponse = await apiService.get(`/api/interview/${interviewId}`);
      console.log('Interview response:', interviewResponse);
      
      if (interviewResponse.success && interviewResponse.data) {
        setInterviewData(interviewResponse.data);
        console.log('✅ Interview data loaded');
      } else {
        throw new Error('Failed to load interview data');
      }

      // Try to fetch existing feedback
      console.log('Fetching feedback...');
      const feedbackResponse = await apiService.get(`/api/interview/${interviewId}/feedback`);
      console.log('Feedback response:', feedbackResponse);
      
      if (feedbackResponse.success && feedbackResponse.data) {
        setFeedbackData(feedbackResponse.data);
        console.log('✅ Feedback loaded');
      } else {
        // Generate feedback if not found
        console.log('Feedback not found, generating...');
        const generateResponse = await apiService.post(`/api/interview/${interviewId}/feedback`, {});
        console.log('Generate feedback response:', generateResponse);
        
        if (generateResponse.success && generateResponse.data) {
          setFeedbackData(generateResponse.data);
          console.log('✅ Feedback generated');
        } else {
          throw new Error('Failed to generate feedback');
        }
      }

      setError(null);
    } catch (error: any) {
      console.error('=== FETCH FEEDBACK ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      setError(error.message || 'Failed to load feedback');
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!interviewId) return;

    setDownloading(true);
    try {
      const response = await apiService.post(`/api/interview/${interviewId}/report`, {});
      
      if (response.success && response.data.reportUrl) {
        // Open download URL
        window.open(response.data.reportUrl, '_blank');
        toast.success('Report downloaded successfully!');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error: any) {
      console.error('Download PDF error:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Feedback</h2>
          <p className="text-muted-foreground mb-4">{error || 'Feedback not available'}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchFeedback} variant="outline">
              Retry
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="primary">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const overallScore = feedbackData.overallRating || feedbackData.metrics?.overallScore || 75;
  
  const scores = [
    { category: 'Communication', score: feedbackData.metrics?.communicationScore || 85, color: '#6366f1' },
    { category: 'Technical', score: feedbackData.metrics?.technicalScore || 82, color: '#8b5cf6' },
    { category: 'Confidence', score: feedbackData.metrics?.confidenceScore || 85, color: '#ec4899' },
    { category: 'Eye Contact', score: interviewData?.analysis?.videoMetrics?.eyeContactPercentage || 78, color: '#f59e0b' },
    { category: 'Speech Clarity', score: feedbackData.metrics?.clarityScore || 90, color: '#10b981' }
  ];

  const strengths = feedbackData.strengths || [
    "Clear and concise explanations of technical concepts",
    "Good use of specific examples from past projects",
    "Confident body language and posture",
  ];

  const improvements = feedbackData.improvements || [
    "Reduce filler words",
    "Slow down speech pace",
    "Provide more quantifiable achievements",
  ];

  const recommendations = (feedbackData.recommendations || []).map((rec: any, index: number) => {
    if (typeof rec === 'string') {
      return {
        title: rec,
        description: rec,
        priority: index === 0 ? 'high' : 'medium'
      };
    }
    return rec;
  });

  // Mock data for charts
  const emotionData = [
    { name: 'Confident', value: 45, color: '#6366f1' },
    { name: 'Neutral', value: 35, color: '#8b5cf6' },
    { name: 'Nervous', value: 15, color: '#ec4899' },
    { name: 'Happy', value: 5, color: '#10b981' },
  ];

  const speechPaceData = [
    { time: '0-5min', wpm: 145 },
    { time: '5-10min', wpm: 155 },
    { time: '10-15min', wpm: 150 },
    { time: '15-20min', wpm: 148 },
    { time: '20-25min', wpm: 152 },
  ];

  const fillerWords = [
    { word: 'um', count: 15 },
    { word: 'uh', count: 12 },
    { word: 'like', count: 10 },
    { word: 'you know', count: 8 },
    { word: 'actually', count: 5 },
  ];

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl gradient-text mb-2">Interview Feedback Report</h1>
            <p className="text-muted-foreground">
              {interviewData?.type || 'Technical'} Round • {interviewData?.createdAt ? new Date(interviewData.createdAt).toLocaleDateString() : 'Recent'} • Duration: {interviewData?.session?.actualDuration || 45} min
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <Home className="mr-2 w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="gradient" glow onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <Card glow className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div>
              <h2 className="text-lg text-muted-foreground mb-4">Overall Performance</h2>
              <div className="relative inline-block">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(overallScore / 100) * 502} 502`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl gradient-text">{overallScore}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <Card className="text-center">
                <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl gradient-text">A</p>
                <p className="text-sm text-muted-foreground">Grade</p>
              </Card>
              <Card className="text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl gradient-text">+12%</p>
                <p className="text-sm text-muted-foreground">vs Last Interview</p>
              </Card>
              <Card className="text-center">
                <CheckCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl gradient-text">4/5</p>
                <p className="text-sm text-muted-foreground">Questions Excellent</p>
              </Card>
              <Card className="text-center">
                <Clock className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className="text-2xl gradient-text">45m</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Detailed Scores */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="text-xl mb-6">Category Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e2e', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {scores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-xl mb-6">Emotion Analysis</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e2e', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {emotionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Speech Analysis */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="text-xl">Speech Pace Analysis</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={speechPaceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[120, 180]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e2e', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wpm" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Average: 150 WPM (Optimal: 120-150 WPM)
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="text-xl">Filler Words Detection</h3>
            </div>
            <div className="space-y-4">
              {fillerWords.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">"{item.word}"</span>
                    <span className="text-sm text-muted-foreground">{item.count} times</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                      style={{ width: `${(item.count / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Total filler words: 50 (Aim for less than 30)
            </p>
          </Card>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-xl">Key Strengths</h3>
            </div>
            <ul className="space-y-3">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl">Areas for Improvement</h3>
            </div>
            <ul className="space-y-3">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-muted-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <h3 className="text-xl mb-6">Personalized Recommendations</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-secondary rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium">{rec.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${
                    rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" onClick={() => navigate('/interview-setup')} glow>
            Start Another Interview
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
