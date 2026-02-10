import { Link } from 'react-router-dom';
import { Play, FileText, TrendingUp, Award, Clock, Target, Brain, Code } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { memo, useMemo, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

export const DashboardPage = memo(function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiService.get('/api/user/stats');
        
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.error || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Memoize skill data from stats or use defaults
  const skillData = useMemo(() => {
    if (stats?.skillProgress && stats.skillProgress.length > 0) {
      return stats.skillProgress.map((skill: any) => ({
        skill: skill.skill,
        value: skill.currentLevel * 10,
      }));
    }
    // Default empty state
    return [
      { skill: 'Communication', value: 0 },
      { skill: 'Technical', value: 0 },
      { skill: 'Problem Solving', value: 0 },
      { skill: 'Confidence', value: 0 },
      { skill: 'Leadership', value: 0 },
      { skill: 'Teamwork', value: 0 }
    ];
  }, [stats]);

  const recentInterviews = useMemo(() => {
    return stats?.recentInterviews || [];
  }, [stats]);

  const statsData = useMemo(() => {
    if (!stats) {
      return [
        { label: 'Interviews', value: '0', icon: Play, color: 'bg-blue-500' },
        { label: 'Avg Score', value: '0%', icon: Award, color: 'bg-purple-500' },
        { label: 'Total Time', value: '0h', icon: Clock, color: 'bg-pink-500' },
        { label: 'Improvement', value: '0%', icon: TrendingUp, color: 'bg-orange-500' }
      ];
    }

    return [
      { label: 'Interviews', value: stats.totalInterviews.toString(), icon: Play, color: 'bg-blue-500' },
      { label: 'Avg Score', value: `${stats.averageScore}%`, icon: Award, color: 'bg-purple-500' },
      { label: 'Total Time', value: '0h', icon: Clock, color: 'bg-pink-500' },
      { label: 'Improvement', value: `${stats.improvementRate >= 0 ? '+' : ''}${stats.improvementRate}%`, icon: TrendingUp, color: 'bg-orange-500' }
    ];
  }, [stats]);

  // Generate next steps based on user progress
  const nextSteps = useMemo(() => {
    const steps: Array<{ text: string; progress: number }> = [];
    
    if (!stats || stats.totalInterviews === 0) {
      steps.push({ text: 'Complete your first interview', progress: 0 });
      steps.push({ text: 'Upload your resume', progress: 0 });
      steps.push({ text: 'Set up your profile', progress: user ? 50 : 0 });
    } else {
      if (stats.totalInterviews < 5) {
        steps.push({ text: 'Complete 5 interviews', progress: (stats.totalInterviews / 5) * 100 });
      }
      if (stats.averageScore < 80) {
        steps.push({ text: 'Achieve 80% average score', progress: (stats.averageScore / 80) * 100 });
      }
      if (!stats.recentInterviews?.some((i: any) => i.type === 'coding')) {
        steps.push({ text: 'Try a coding interview', progress: 0 });
      }
    }
    
    // Always show at least 3 steps
    while (steps.length < 3) {
      steps.push({ text: 'Practice more interviews', progress: 25 });
    }
    
    return steps;
  }, [stats, user]);

  const userName = user ? `${user.profile.firstName} ${user.profile.lastName}` : 'User';
  const userRole = user?.preferences.role || 'Professional';
  const userExperience = user?.preferences.experienceLevel || 'entry';
  const userSkills = user?.preferences.industries || [];

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-4 bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="default">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground">Ready to practice your next interview?</p>
          </div>
          <Link to="/interview-setup">
            <Button variant="default" size="lg">
              <Play className="mr-2 w-5 h-5" />
              Start New Interview
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <Card>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center text-3xl font-bold text-white">
                  {user?.profile.firstName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{userName}</h2>
                  <p className="text-muted-foreground mb-3">
                    {userRole} • {userExperience.charAt(0).toUpperCase() + userExperience.slice(1)} Level
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userSkills.length > 0 ? (
                      userSkills.slice(0, 4).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-primary rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No skills added yet</span>
                    )}
                  </div>
                </div>
                <Link to="/profile">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Recent Interviews */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Recent Interviews</h3>
                <Link to="/history">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>

              {recentInterviews.length > 0 ? (
                <div className="space-y-4">
                  {recentInterviews.map((interview: any) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          interview.score >= 85 ? 'bg-green-100' :
                          interview.score >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {interview.type === 'coding' ? (
                            <Code className="w-6 h-6 text-primary" />
                          ) : (
                            <Brain className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{interview.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(interview.date).toLocaleDateString()} • {interview.duration || 0} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            interview.score >= 85 ? 'text-green-600' :
                            interview.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {interview.score}%
                          </p>
                        </div>
                        <Link to={`/feedback/${interview.id}`}>
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground mb-4">No interviews yet</p>
                  <Link to="/interview-setup">
                    <Button variant="default">
                      <Play className="mr-2 w-4 h-4" />
                      Start Your First Interview
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/interview-setup">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Technical Interview</h3>
                  <p className="text-muted-foreground text-sm">Practice system design and architecture questions</p>
                </Card>
              </Link>
              <Link to="/coding-interview">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Coding Challenge</h3>
                  <p className="text-muted-foreground text-sm">Solve algorithmic problems with AI feedback</p>
                </Card>
              </Link>
            </div>
          </div>

          {/* Right Column - Skills Radar */}
          <div className="space-y-8">
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Skill Assessment</h3>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                    />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Overall Score</span>
                  <span className="text-primary font-semibold">80/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Recommended Next Steps</h3>
              <div className="space-y-3">
                {nextSteps.map((step, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{step.text}</span>
                      <span className="text-primary font-semibold">{step.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all" 
                        style={{ width: `${step.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});