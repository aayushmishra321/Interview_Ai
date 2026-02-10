import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' 
    });
  }

  // Generate interview questions based on role and resume
  async generateInterviewQuestions(params: {
    role: string;
    experienceLevel: string;
    interviewType: string;
    resumeAnalysis?: any;
    difficulty: string;
    count: number;
  }): Promise<any[]> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const questions = JSON.parse(text);
      
      logger.info(`Generated ${questions.length} questions for ${params.role} role`);
      return questions;

    } catch (error) {
      logger.error('Error generating interview questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  // Analyze interview response
  async analyzeResponse(params: {
    question: string;
    answer: string;
    role: string;
    expectedKeywords?: string[];
    context?: any;
  }): Promise<any> {
    try {
      const prompt = this.buildResponseAnalysisPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = JSON.parse(text);
      
      logger.info(`Analyzed response for question: ${params.question.substring(0, 50)}...`);
      return analysis;

    } catch (error) {
      logger.error('Error analyzing response:', error);
      throw new Error('Failed to analyze response');
    }
  }

  // Generate comprehensive feedback
  async generateFeedback(params: {
    interviewData: any;
    analysisResults: any;
    userProfile: any;
  }): Promise<any> {
    try {
      const prompt = this.buildFeedbackPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const feedback = JSON.parse(text);
      
      logger.info(`Generated comprehensive feedback for interview ${params.interviewData.id}`);
      return feedback;

    } catch (error) {
      logger.error('Error generating feedback:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  // Generate follow-up questions
  async generateFollowUpQuestions(params: {
    originalQuestion: string;
    userAnswer: string;
    role: string;
    context?: any;
  }): Promise<string[]> {
    try {
      const prompt = this.buildFollowUpPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const followUps = JSON.parse(text);
      
      return followUps.questions || [];

    } catch (error) {
      logger.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  // Analyze resume content
  async analyzeResume(params: {
    resumeText: string;
    targetRole?: string;
  }): Promise<any> {
    try {
      const prompt = this.buildResumeAnalysisPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = JSON.parse(text);
      
      logger.info('Analyzed resume content');
      return analysis;

    } catch (error) {
      logger.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  // Generate improvement recommendations
  async generateRecommendations(params: {
    userProfile: any;
    interviewHistory: any[];
    currentPerformance: any;
  }): Promise<any> {
    try {
      const prompt = this.buildRecommendationsPrompt(params);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const recommendations = JSON.parse(text);
      
      return recommendations;

    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  // Private helper methods for building prompts

  private buildQuestionGenerationPrompt(params: any): string {
    const resumeContext = params.resumeContext ? `

CANDIDATE'S RESUME CONTEXT:
Skills: ${params.resumeContext.skills.join(', ')}
Experience: ${JSON.stringify(params.resumeContext.experience).substring(0, 500)}
Projects: ${JSON.stringify(params.resumeContext.projects).substring(0, 500)}
Summary: ${params.resumeContext.summary}

IMPORTANT: Generate questions that are SPECIFICALLY TAILORED to this candidate's background, skills, and experience. Ask about their specific projects, technologies they've used, and experiences mentioned in their resume.
` : '';

    return `
You are an expert technical interviewer. Generate ${params.count} interview questions for a ${params.role} position.

Parameters:
- Role: ${params.role}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty: ${params.difficulty}
${params.resumeAnalysis ? `- Resume Analysis: ${JSON.stringify(params.resumeAnalysis)}` : ''}
${resumeContext}

Requirements:
1. Questions should be appropriate for the experience level
2. Include a mix of behavioral, technical, and situational questions
3. Questions should be relevant to the specific role
4. Each question should have an expected duration (in minutes)
5. Include follow-up questions where appropriate
${params.resumeContext ? '6. CRITICAL: Questions MUST reference specific skills, projects, or experiences from the resume above' : ''}

Return the response as a JSON array with this structure:
[
  {
    "id": "unique_id",
    "text": "question text",
    "type": "behavioral|technical|coding",
    "difficulty": "easy|medium|hard",
    "expectedDuration": 5,
    "category": "category_name",
    "followUpQuestions": ["follow up 1", "follow up 2"]
  }
]

Generate questions now:
`;
  }

  private buildResponseAnalysisPrompt(params: any): string {
    return `
You are an expert interview analyst. Analyze the following interview response:

Question: "${params.question}"
Answer: "${params.answer}"
Role: ${params.role}
${params.expectedKeywords ? `Expected Keywords: ${params.expectedKeywords.join(', ')}` : ''}

Analyze the response on these dimensions:
1. Relevance to the question (0-100)
2. Technical accuracy (0-100)
3. Communication clarity (0-100)
4. Structure and organization (0-100)
5. Depth of knowledge (0-100)
6. Use of examples (0-100)

Also identify:
- Key strengths in the response
- Areas for improvement
- Missing elements
- Keyword matches
- Overall impression

Return as JSON:
{
  "scores": {
    "relevance": 85,
    "technicalAccuracy": 90,
    "clarity": 80,
    "structure": 75,
    "depth": 85,
    "examples": 70
  },
  "overallScore": 81,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "missingElements": ["element 1", "element 2"],
  "keywordMatches": ["keyword 1", "keyword 2"],
  "feedback": "detailed feedback text"
}
`;
  }

  private buildFeedbackPrompt(params: any): string {
    return `
You are an expert career coach and interview specialist. Generate comprehensive feedback for this interview:

Interview Data: ${JSON.stringify(params.interviewData, null, 2)}
Analysis Results: ${JSON.stringify(params.analysisResults, null, 2)}
User Profile: ${JSON.stringify(params.userProfile, null, 2)}

Generate detailed feedback including:
1. Overall performance rating (0-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific recommendations (3-5 actionable items)
5. Skill assessment for relevant skills
6. Next steps for improvement
7. Detailed narrative feedback

Return as JSON:
{
  "overallRating": 85,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "skillAssessment": [
    {
      "skill": "Communication",
      "currentLevel": 8,
      "targetLevel": 9,
      "feedback": "specific feedback"
    }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "detailedFeedback": "comprehensive narrative feedback"
}
`;
  }

  private buildFollowUpPrompt(params: any): string {
    return `
Generate 2-3 relevant follow-up questions based on this interview exchange:

Original Question: "${params.originalQuestion}"
User Answer: "${params.userAnswer}"
Role: ${params.role}

The follow-up questions should:
1. Dig deeper into the candidate's response
2. Clarify any ambiguous points
3. Explore related technical or behavioral aspects
4. Be appropriate for the role and experience level

Return as JSON:
{
  "questions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}
`;
  }

  private buildResumeAnalysisPrompt(params: any): string {
    return `
Analyze this resume content and extract key information:

Resume Text: "${params.resumeText}"
${params.targetRole ? `Target Role: ${params.targetRole}` : ''}

Extract and analyze:
1. Skills (technical and soft skills)
2. Experience level (years)
3. Education background
4. Certifications
5. Key achievements
6. Industry experience
7. Leadership experience
8. Match score for target role (if provided)

Return as JSON:
{
  "skills": ["skill1", "skill2", "skill3"],
  "experience": 5,
  "education": [
    {
      "degree": "Bachelor's in Computer Science",
      "institution": "University Name",
      "year": 2020,
      "gpa": 3.8
    }
  ],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1", "achievement2"],
  "industries": ["industry1", "industry2"],
  "leadership": ["leadership experience"],
  "summary": "professional summary",
  "matchScore": 85,
  "recommendations": ["recommendation1", "recommendation2"]
}
`;
  }

  private buildRecommendationsPrompt(params: any): string {
    return `
Generate personalized improvement recommendations based on:

User Profile: ${JSON.stringify(params.userProfile, null, 2)}
Interview History: ${JSON.stringify(params.interviewHistory, null, 2)}
Current Performance: ${JSON.stringify(params.currentPerformance, null, 2)}

Generate recommendations in these categories:
1. Technical skills to develop
2. Behavioral interview preparation
3. Communication improvements
4. Industry-specific knowledge
5. Practice resources and methods

Prioritize recommendations based on:
- Current skill gaps
- Career goals
- Performance trends
- Industry requirements

Return as JSON:
{
  "recommendations": [
    {
      "category": "Technical Skills",
      "title": "recommendation title",
      "description": "detailed description",
      "priority": "high|medium|low",
      "timeframe": "1-2 weeks",
      "resources": ["resource1", "resource2"]
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "title": "step title",
      "description": "step description",
      "duration": "2 weeks"
    }
  ],
  "practiceAreas": ["area1", "area2", "area3"]
}
`;
  }
}

export default new GeminiService();