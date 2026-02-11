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
      id: 'system-design',
      name: 'System Design',
      icon: Users,
      description: 'Architecture design, scalability, and system components',
      duration: '45-60 min',
      difficulty: 'Hard',
      color: 'bg-orange-500'
    }
  ];

  const handleStart = async () => {
    console.log('=== INTERVIEW CREATION DEBUG ===');
    console.log('Selected Type:', selectedType);
    console.log('Selected Role:', selectedRole);
    console.log('Selected Difficulty:', selectedDifficulty);
    console.log('Duration:', duration);
    
    if (!selectedType) {
      console.error('Validation failed: No interview type selected');
      toast.error('Please select an interview type');
      return;
    }

    if (!selectedRole) {
      console.error('Validation failed: No role entered');
      toast.error('Please enter your target role');
      return;
    }

    // Prepare payload
    const payload = {
      type: selectedType as 'behavioral' | 'technical' | 'coding' | 'system-design',
      settings: {
        role: selectedRole,
        difficulty: selectedDifficulty,
        duration,
        includeVideo: true,
        includeAudio: true,
        includeCoding: selectedType === 'coding',
      },
    };
    
    console.log('Payload to be sent:', JSON.stringify(payload, null, 2));
    console.log('Payload type check:', typeof payload.type, payload.type);
    console.log('Settings check:', payload.settings);

    try {
      console.log('Calling createInterview...');
      
      // Create interview
      await createInterview(payload);

      console.log('Interview created successfully!');
      toast.success('Interview created successfully!');

      // Get the created interview from the store
      const createdInterview = useInterviewStore.getState().currentInterview;
      
      if (!createdInterview) {
        console.error('No interview found after creation');
        toast.error('Interview created but data is missing');
        return;
      }

      // Handle both _id (MongoDB) and id formats
      const interviewId = (createdInterview as any)._id || 
                         (createdInterview as any).id || 
                         createdInterview.id;
      
      if (!interviewId) {
        console.error('No interview ID found. Interview object:', createdInterview);
        toast.error('Interview created but ID is missing');
        return;
      }

      // Convert ObjectId to string if needed
      const idString = typeof interviewId === 'object' ? interviewId.toString() : interviewId;
      console.log('Created interview ID:', idString);

      // Navigate based on type with interview ID
      if (selectedType === 'coding') {
        console.log('Navigating to coding interview with ID:', idString);
        navigate(`/coding-interview?id=${idString}`);
      } else {
        console.log('Navigating to interview room with ID:', idString);
        navigate(`/interview-room?id=${idString}`);
      }
    } catch (error: any) {
      console.error('=== INTERVIEW CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show detailed error to user
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create interview';
      
      toast.error(errorMessage);
      
      // Log validation details if available
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
        error.response.data.details.forEach((detail: any) => {
          console.error(`  - ${detail.msg || detail.message} (field: ${detail.param || detail.path})`);
        });
      }
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
