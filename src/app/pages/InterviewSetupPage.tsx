import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Code, MessageSquare, Users, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useInterviewStore } from '../stores/interviewStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createInterview, isLoading } = useInterviewStore();
  
  const [selectedType, setSelectedType] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [duration, setDuration] = useState(45);

  const interviewTypes = [
    {
      id: 'technical',
      name: 'Technical Interview',
      icon: Video,
      description: 'System design, architecture, and technical problem solving',
      duration: '45-60 min',
      difficulty: 'Medium',
      color: 'bg-blue-500'
    },
    {
      id: 'coding',
      name: 'Coding Challenge',
      icon: Code,
      description: 'Live coding with algorithmic problem solving',
      duration: '60-90 min',
      difficulty: 'Hard',
      color: 'bg-purple-500'
    },
    {
      id: 'behavioral',
      name: 'Behavioral Interview',
      icon: MessageSquare,
      description: 'Past experiences, leadership, and teamwork scenarios',
      duration: '30-45 min',
      difficulty: 'Easy',
      color: 'bg-pink-500'
    },
    {
      id: 'hr',
      name: 'HR Round',
      icon: Users,
      description: 'Culture fit, career goals, and company expectations',
      duration: '20-30 min',
      difficulty: 'Easy',
      color: 'bg-orange-500'
    }
  ];

  const handleStart = async () => {
    if (!selectedType) {
      toast.error('Please select an interview type');
      return;
    }

    if (!selectedRole) {
      toast.error('Please enter your target role');
      return;
    }

    try {
      // Create interview
      await createInterview({
        type: selectedType as 'behavioral' | 'technical' | 'coding' | 'system-design',
        settings: {
          role: selectedRole,
          difficulty: selectedDifficulty,
          duration,
          includeVideo: true,
          includeAudio: true,
          includeCoding: selectedType === 'coding',
        },
      });

      toast.success('Interview created successfully!');

      // Navigate based on type
      if (selectedType === 'coding') {
        navigate('/coding-interview');
      } else {
        // Get the created interview ID from store and navigate
        navigate('/interview-room');
      }
    } catch (error: any) {
      console.error('Failed to create interview:', error);
      toast.error('Failed to create interview');
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Interview Type</h1>
          <p className="text-xl text-muted-foreground">
            Select the type of interview you'd like to practice
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {interviewTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`text-left transition-all ${
                selectedType === type.id ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <Card 
                className={`cursor-pointer ${
                  selectedType === type.id ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                hover
              >
                <div className={`w-14 h-14 ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-muted-foreground">{type.duration}</span>
                  <div className="h-4 w-px bg-border"></div>
                  <span className={`${
                    type.difficulty === 'Easy' ? 'text-green-600' :
                    type.difficulty === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {type.difficulty}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* Role and Settings */}
        {selectedType && (
          <Card className="mb-8 p-6">
            <h3 className="text-lg font-semibold mb-4">Interview Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target Role</label>
                <input
                  type="text"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedDifficulty(level)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedDifficulty === level
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration: {duration} minutes</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-col items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={!selectedType || !selectedRole || isLoading}
            className="min-w-64"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Creating Interview...
              </>
            ) : (
              <>
                Start Interview
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Make sure your camera and microphone are ready
          </p>
        </div>
      </div>
    </div>
  );
}
