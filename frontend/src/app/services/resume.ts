import { apiService } from './api';
import { Resume, ResumeAnalysis, APIResponse, PaginatedResponse } from '../types';

class ResumeService {
  async uploadResume(file: File): Promise<APIResponse<Resume>> {
    const formData = new FormData();
    formData.append('resume', file);

    return apiService.upload<Resume>('/api/resume/upload', formData);
  }

  async getResumes(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Resume>> {
    return apiService.getPaginated<Resume>('/api/resume', page, limit);
  }

  async getResume(resumeId: string): Promise<APIResponse<Resume>> {
    return apiService.get<Resume>(`/api/resume/${resumeId}`);
  }

  async analyzeResume(resumeId: string): Promise<APIResponse<ResumeAnalysis>> {
    return apiService.post<ResumeAnalysis>(`/api/resume/${resumeId}/analyze`);
  }

  async updateResume(resumeId: string, updates: Partial<Resume>): Promise<APIResponse<Resume>> {
    return apiService.put<Resume>(`/api/resume/${resumeId}`, updates);
  }

  async deleteResume(resumeId: string): Promise<APIResponse<{ success: boolean }>> {
    return apiService.delete(`/api/resume/${resumeId}`);
  }

  async getResumeAnalysis(resumeId: string): Promise<APIResponse<ResumeAnalysis>> {
    return apiService.get<ResumeAnalysis>(`/api/resume/${resumeId}/analysis`);
  }

  async generateResumeInsights(resumeId: string, targetRole: string): Promise<APIResponse<{
    matchScore: number;
    missingSkills: string[];
    recommendations: string[];
    strengthAreas: string[];
    improvementAreas: string[];
  }>> {
    return apiService.post(`/api/resume/${resumeId}/insights`, { targetRole });
  }

  async optimizeResume(
    resumeId: string,
    targetRole: string,
    jobDescription?: string
  ): Promise<APIResponse<{
    suggestions: string[];
    optimizedSections: {
      summary: string;
      skills: string[];
      experience: string[];
    };
  }>> {
    return apiService.post(`/api/resume/${resumeId}/optimize`, {
      targetRole,
      jobDescription,
    });
  }

  async parseResumeText(file: File): Promise<APIResponse<{
    text: string;
    sections: {
      [key: string]: string;
    };
  }>> {
    const formData = new FormData();
    formData.append('resume', file);

    return apiService.upload('/api/resume/parse', formData);
  }

  async validateResume(resumeId: string): Promise<APIResponse<{
    isValid: boolean;
    issues: string[];
    score: number;
    recommendations: string[];
  }>> {
    return apiService.get(`/api/resume/${resumeId}/validate`);
  }

  async compareResumes(resumeId1: string, resumeId2: string): Promise<APIResponse<{
    comparison: {
      skills: {
        common: string[];
        unique1: string[];
        unique2: string[];
      };
      experience: {
        resume1: number;
        resume2: number;
      };
      strengths: {
        resume1: string[];
        resume2: string[];
      };
    };
    recommendation: string;
  }>> {
    return apiService.post('/api/resume/compare', {
      resumeId1,
      resumeId2,
    });
  }

  async getSkillSuggestions(currentSkills: string[], targetRole: string): Promise<APIResponse<{
    recommended: string[];
    trending: string[];
    priority: string[];
  }>> {
    return apiService.post('/api/resume/skill-suggestions', {
      currentSkills,
      targetRole,
    });
  }

  async generateCoverLetter(
    resumeId: string,
    jobDescription: string,
    companyName: string
  ): Promise<APIResponse<{
    coverLetter: string;
    keyPoints: string[];
  }>> {
    return apiService.post(`/api/resume/${resumeId}/cover-letter`, {
      jobDescription,
      companyName,
    });
  }

  async getResumeTemplates(): Promise<APIResponse<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      preview: string;
      category: string;
    }>;
  }>> {
    return apiService.get('/api/resume/templates');
  }

  async applyTemplate(
    resumeId: string,
    templateId: string
  ): Promise<APIResponse<{
    formattedResume: string;
    downloadUrl: string;
  }>> {
    return apiService.post(`/api/resume/${resumeId}/apply-template`, {
      templateId,
    });
  }
}

export const resumeService = new ResumeService();
export default resumeService;