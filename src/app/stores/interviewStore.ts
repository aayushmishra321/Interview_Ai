import { create } from 'zustand';
import {
  Interview,
  InterviewSession,
  Question,
  Response,
  InterviewAnalysis,
  InterviewFeedback,
  InterviewSetupForm,
} from '../types';
import { interviewService } from '../services/interview';

interface InterviewState {
  // Current interview session
  currentInterview: Interview | null;
  currentSession: InterviewSession | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  
  // Interview history
  interviews: Interview[];
  
  // Analysis and feedback
  analysis: InterviewAnalysis | null;
  feedback: InterviewFeedback | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isRecording: boolean;
  
  // WebRTC state
  mediaStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  
  // Actions
  createInterview: (setup: InterviewSetupForm) => Promise<void>;
  startInterview: (interviewId: string) => Promise<void>;
  endInterview: () => Promise<void>;
  getNextQuestion: () => Promise<void>;
  submitResponse: (response: Partial<Response>) => Promise<void>;
  getInterviewHistory: () => Promise<void>;
  getAnalysis: (interviewId: string) => Promise<void>;
  getFeedback: (interviewId: string) => Promise<void>;
  
  // Media controls
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  setMediaStream: (stream: MediaStream | null) => void;
  
  // Utility
  clearError: () => void;
  resetSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  // Initial state
  currentInterview: null,
  currentSession: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  interviews: [],
  analysis: null,
  feedback: null,
  isLoading: false,
  error: null,
  isRecording: false,
  mediaStream: null,
  peerConnection: null,

  createInterview: async (setup: InterviewSetupForm) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await interviewService.createInterview(setup);
      
      if (response.success && response.data) {
        set({
          currentInterview: response.data,
          isLoading: false,
        });
      } else {
        set({
          error: response.error || 'Failed to create interview',
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create interview',
        isLoading: false,
      });
    }
  },

  startInterview: async (interviewId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await interviewService.startInterview(interviewId);
      
      if (response.success && response.data) {
        set({
          currentSession: response.data,
          isLoading: false,
        });
        
        // Get the first question
        await get().getNextQuestion();
      } else {
        set({
          error: response.error || 'Failed to start interview',
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to start interview',
        isLoading: false,
      });
    }
  },

  endInterview: async () => {
    const { currentInterview, currentSession } = get();
    
    if (!currentInterview || !currentSession) return;
    
    set({ isLoading: true });
    
    try {
      // Stop recording if active
      get().stopRecording();
      
      const response = await interviewService.endInterview(currentInterview.id);
      
      if (response.success && response.data) {
        set({
          currentInterview: response.data,
          currentSession: null,
          currentQuestion: null,
          currentQuestionIndex: 0,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to end interview',
        isLoading: false,
      });
    }
  },

  getNextQuestion: async () => {
    const { currentInterview } = get();
    
    if (!currentInterview) return;
    
    try {
      const response = await interviewService.getNextQuestion(currentInterview.id);
      
      if (response.success && response.data) {
        set((state) => ({
          currentQuestion: response.data,
          currentQuestionIndex: state.currentQuestionIndex + 1,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to get next question' });
    }
  },

  submitResponse: async (response: Partial<Response>) => {
    const { currentInterview, currentQuestion } = get();
    
    if (!currentInterview || !currentQuestion) return;
    
    try {
      await interviewService.submitResponse(
        currentInterview.id,
        currentQuestion.id,
        response
      );
      
      // Get next question after submitting response
      await get().getNextQuestion();
    } catch (error: any) {
      set({ error: error.message || 'Failed to submit response' });
    }
  },

  getInterviewHistory: async () => {
    set({ isLoading: true });
    
    try {
      const response = await interviewService.getInterviewHistory();
      
      if (response.data) {
        set({
          interviews: response.data,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get interview history',
        isLoading: false,
      });
    }
  },

  getAnalysis: async (interviewId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await interviewService.getInterviewAnalysis(interviewId);
      
      if (response.success && response.data) {
        set({
          analysis: response.data,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get analysis',
        isLoading: false,
      });
    }
  },

  getFeedback: async (interviewId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await interviewService.getFeedback(interviewId);
      
      if (response.success && response.data) {
        set({
          feedback: response.data,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get feedback',
        isLoading: false,
      });
    }
  },

  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      set({
        mediaStream: stream,
        isRecording: true,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to start recording' });
    }
  },

  stopRecording: () => {
    const { mediaStream } = get();
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    
    set({
      mediaStream: null,
      isRecording: false,
    });
  },

  setMediaStream: (stream: MediaStream | null) => {
    set({ mediaStream: stream });
  },

  clearError: () => set({ error: null }),

  resetSession: () => {
    const { mediaStream } = get();
    
    // Clean up media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    
    set({
      currentInterview: null,
      currentSession: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      analysis: null,
      feedback: null,
      isRecording: false,
      mediaStream: null,
      peerConnection: null,
      error: null,
    });
  },
}));