import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, Save, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile.firstName || '',
    lastName: user?.profile.lastName || '',
    email: user?.email || '',
    phone: user?.profile.phone || '',
    location: user?.profile.location || '',
    role: user?.preferences.role || '',
    experienceLevel: user?.preferences.experienceLevel || 'entry',
    industries: user?.preferences.industries || [] as string[],
    interviewTypes: user?.preferences.interviewTypes || [] as string[],
  });

  const [newIndustry, setNewIndustry] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profile.avatar || '');

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5-10 years)' },
    { value: 'executive', label: 'Executive (10+ years)' },
  ];

  const interviewTypeOptions = [
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'technical', label: 'Technical' },
    { value: 'coding', label: 'Coding' },
    { value: 'system-design', label: 'System Design' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !formData.industries.includes(newIndustry.trim())) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  };

  const handleRemoveIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.filter(i => i !== industry)
    }));
  };

  const handleInterviewTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      interviewTypes: prev.interviewTypes.includes(type)
        ? prev.interviewTypes.filter(t => t !== type)
        : [...prev.interviewTypes, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload avatar if changed
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        
        // For now, just use the preview URL
        // In production, upload to Cloudinary via backend
        // const avatarResponse = await apiService.post('/api/user/upload-avatar', avatarFormData);
      }

      // Update profile
      const response = await apiService.put('/api/user/profile', {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          location: formData.location,
          avatar: avatarPreview,
        },
        preferences: {
          role: formData.role,
          experienceLevel: formData.experienceLevel,
          industries: formData.industries,
          interviewTypes: formData.interviewTypes,
        },
      });

      if (response.success) {
        // Update local user state
        if (response.data) {
          setUser(response.data as any);
        }
        toast.success('Profile updated successfully!');
        navigate('/dashboard');
      } else {
        toast.error(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-muted-foreground">Update your personal information and preferences</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-3xl font-bold text-white">
                    {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Upload a profile picture. Recommended size: 400x400px
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* Professional Information */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Current Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industries / Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIndustry())}
                    placeholder="Add industry or skill"
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="button" onClick={handleAddIndustry} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.industries.map((industry, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-primary rounded-full text-sm flex items-center gap-2"
                    >
                      {industry}
                      <button
                        type="button"
                        onClick={() => handleRemoveIndustry(industry)}
                        className="text-primary hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Interview Types</label>
                <div className="grid grid-cols-2 gap-3">
                  {interviewTypeOptions.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInterviewTypeToggle(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.interviewTypes.includes(type.value)
                          ? 'border-primary bg-blue-50'
                          : 'border-border bg-white hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          formData.interviewTypes.includes(type.value)
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {formData.interviewTypes.includes(type.value) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
