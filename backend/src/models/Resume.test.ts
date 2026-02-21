import mongoose from 'mongoose';
import Resume from './Resume';
import { cleanupTestData } from '../test/helpers';

describe('Resume Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  afterAll(async () => {
    await cleanupTestData();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('Resume Creation', () => {
    it('should create a resume with required fields', async () => {
      const resumeData = {
        userId: new mongoose.Types.ObjectId(),
        filename: 'test-resume.pdf',
        fileUrl: 'https://example.com/resume.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        analysis: {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 3,
          education: [],
          certifications: [],
          achievements: [],
          industries: [],
          leadership: [],
          summary: 'Experienced developer',
        },
        metadata: {
          processingStatus: 'completed',
        },
      };

      const resume = await Resume.create(resumeData);

      expect(resume._id).toBeDefined();
      expect(resume.filename).toBe('test-resume.pdf');
      expect(resume.analysis.skills).toHaveLength(3);
    });

    it('should set default values', async () => {
      const resumeData = {
        userId: new mongoose.Types.ObjectId(),
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      const resume = await Resume.create(resumeData);

      expect(resume.metadata.processingStatus).toBe('pending');
      expect(resume.storageType).toBe('local');
      expect(resume.analysis.experience).toBe(0);
    });

    it('should require userId', async () => {
      const resumeData = {
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      await expect(Resume.create(resumeData)).rejects.toThrow();
    });

    it('should require filename', async () => {
      const resumeData = {
        userId: new mongoose.Types.ObjectId(),
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      await expect(Resume.create(resumeData)).rejects.toThrow();
    });
  });

  describe('Resume Methods', () => {
    let resume: any;

    beforeEach(async () => {
      resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        metadata: {
          processingStatus: 'completed',
          lastAnalyzedAt: new Date(),
        },
      });
    });

    it('should check if analysis is complete', () => {
      expect(resume.isAnalysisComplete()).toBe(true);

      resume.metadata.processingStatus = 'pending';
      expect(resume.isAnalysisComplete()).toBe(false);
    });

    it('should calculate analysis age', () => {
      const age = resume.getAnalysisAge();
      expect(age).toBe(0); // Just created

      resume.metadata.lastAnalyzedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(resume.getAnalysisAge()).toBe(2);
    });

    it('should return null for analysis age when not analyzed', () => {
      resume.metadata.lastAnalyzedAt = null;
      expect(resume.getAnalysisAge()).toBeNull();
    });
  });

  describe('Resume Static Methods', () => {
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      userId = new mongoose.Types.ObjectId();

      // Create multiple resumes
      await Resume.create({
        userId,
        filename: 'resume1.pdf',
        fileUrl: 'https://example.com/resume1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      await Resume.create({
        userId,
        filename: 'resume2.pdf',
        fileUrl: 'https://example.com/resume2.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        createdAt: new Date(),
      });
    });

    it('should get latest resume by user', async () => {
      const latest = await Resume.getLatestByUser(userId);

      expect(latest).toBeDefined();
      expect(latest?.filename).toBe('resume2.pdf');
    });

    it('should get pending analysis resumes', async () => {
      await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'pending.pdf',
        fileUrl: 'https://example.com/pending.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        metadata: {
          processingStatus: 'pending',
        },
      });

      const pending = await Resume.getPendingAnalysis();

      expect(pending.length).toBeGreaterThan(0);
      expect(pending[0].metadata.processingStatus).toBe('pending');
    });
  });

  describe('Resume Virtuals', () => {
    it('should get file extension', async () => {
      const resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test-resume.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });

      expect(resume.fileExtension).toBe('pdf');
    });

    it('should handle filenames without extension', async () => {
      const resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test',
        fileUrl: 'https://example.com/test',
        fileSize: 1024,
        mimeType: 'application/octet-stream',
      });

      expect(resume.fileExtension).toBeDefined();
    });
  });

  describe('Resume Analysis', () => {
    it('should store education data', async () => {
      const resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: {
          skills: [],
          experience: 0,
          education: [
            {
              degree: 'Bachelor of Science',
              institution: 'University of Example',
              year: 2020,
              gpa: 3.8,
            },
          ],
          certifications: [],
          achievements: [],
          industries: [],
          leadership: [],
          summary: '',
        },
      });

      expect(resume.analysis.education).toHaveLength(1);
      expect(resume.analysis.education[0].degree).toBe('Bachelor of Science');
      expect(resume.analysis.education[0].gpa).toBe(3.8);
    });

    it('should store recommendations', async () => {
      const resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: {
          skills: [],
          experience: 0,
          education: [],
          certifications: [],
          achievements: [],
          industries: [],
          leadership: [],
          summary: '',
          recommendations: [
            {
              title: 'Add metrics',
              description: 'Include quantifiable achievements',
              priority: 'high',
            },
          ],
        },
      });

      expect(resume.analysis.recommendations).toHaveLength(1);
    });

    it('should validate score range', async () => {
      const resume = await Resume.create({
        userId: new mongoose.Types.ObjectId(),
        filename: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: {
          skills: [],
          experience: 0,
          education: [],
          certifications: [],
          achievements: [],
          industries: [],
          leadership: [],
          summary: '',
          score: 85,
        },
      });

      expect(resume.analysis.score).toBe(85);

      // Test invalid score
      resume.analysis.score = 150;
      await expect(resume.save()).rejects.toThrow();
    });
  });
});
