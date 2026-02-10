import { Users, Video, TrendingUp, AlertTriangle, Activity, Award } from 'lucide-react';
import { Card } from '../components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function AdminDashboardPage() {
  const stats = [
    { 
      label: 'Total Users', 
      value: '12,547', 
      change: '+23%', 
      icon: Users, 
      color: 'from-indigo-500 to-purple-500' 
    },
    { 
      label: 'Total Interviews', 
      value: '45,234', 
      change: '+18%', 
      icon: Video, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'Avg Success Rate', 
      value: '87%', 
      change: '+5%', 
      icon: TrendingUp, 
      color: 'from-pink-500 to-red-500' 
    },
    { 
      label: 'Active Issues', 
      value: '23', 
      change: '-12%', 
      icon: AlertTriangle, 
      color: 'from-orange-500 to-yellow-500' 
    }
  ];

  const userGrowthData = [
    { month: 'Jul', users: 3200 },
    { month: 'Aug', users: 4100 },
    { month: 'Sep', users: 5300 },
    { month: 'Oct', users: 6800 },
    { month: 'Nov', users: 8900 },
    { month: 'Dec', users: 10400 },
    { month: 'Jan', users: 12547 }
  ];

  const interviewTypeData = [
    { type: 'Technical', count: 15234 },
    { type: 'HR', count: 12456 },
    { type: 'Behavioral', count: 9876 },
    { type: 'Coding', count: 7668 }
  ];

  const aiPerformanceData = [
    { metric: 'Accuracy', value: 94 },
    { metric: 'Response Time', value: 88 },
    { metric: 'User Satisfaction', value: 92 },
    { metric: 'Question Quality', value: 89 },
    { metric: 'Feedback Accuracy', value: 91 }
  ];

  const recentActivity = [
    { user: 'john.doe@email.com', action: 'Completed Technical Interview', time: '2 min ago', score: 85 },
    { user: 'sarah.smith@email.com', action: 'Started Coding Challenge', time: '5 min ago', score: null },
    { user: 'mike.johnson@email.com', action: 'Uploaded Resume', time: '12 min ago', score: null },
    { user: 'emma.wilson@email.com', action: 'Downloaded Report', time: '18 min ago', score: 92 },
    { user: 'alex.brown@email.com', action: 'Completed HR Round', time: '25 min ago', score: 78 }
  ];

  const systemMetrics = [
    { time: '00:00', cpu: 45, memory: 62, requests: 234 },
    { time: '04:00', cpu: 38, memory: 58, requests: 156 },
    { time: '08:00', cpu: 72, memory: 75, requests: 456 },
    { time: '12:00', cpu: 85, memory: 82, requests: 678 },
    { time: '16:00', cpu: 78, memory: 79, requests: 589 },
    { time: '20:00', cpu: 62, memory: 70, requests: 423 }
  ];

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform performance and user activity</p>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl gradient-text mb-1">{stat.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <span className={`text-sm ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-xl">User Growth</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e2e', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#userGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="text-xl">Interview Types</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={interviewTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis dataKey="type" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e1e2e', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* AI Performance */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-xl">AI Model Performance Metrics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
            {aiPerformanceData.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="relative inline-block mb-3">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(99, 102, 241, 0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#6366f1"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(metric.value / 100) * 251} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl gradient-text">{metric.value}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{metric.metric}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* System Metrics & Recent Activity - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-xl">System Metrics</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                  <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e2e', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="requests" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#6366f1] rounded-full"></div>
                  <span className="text-sm">CPU %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                  <span className="text-sm">Memory %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#ec4899] rounded-full"></div>
                  <span className="text-sm">Requests</span>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-lg">Recent Activity</h3>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="pb-4 border-b border-border last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{activity.user}</p>
                    {activity.score !== null && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded shrink-0">
                        {activity.score}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Error Logs */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xl">Recent Error Logs</h3>
          </div>
          <div className="space-y-2">
            {[
              { severity: 'warning', message: 'High API response time detected', time: '10 min ago' },
              { severity: 'error', message: 'Database connection timeout', time: '1 hour ago' },
              { severity: 'warning', message: 'Memory usage above 80%', time: '2 hours ago' },
              { severity: 'info', message: 'Scheduled backup completed', time: '3 hours ago' }
            ].map((log, index) => (
              <div key={index} className="p-3 bg-secondary rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.severity === 'error' ? 'bg-red-400' :
                    log.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}></div>
                  <span className="text-sm">{log.message}</span>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
