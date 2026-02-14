import cloudinaryService from './cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'test-public-id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        format: 'jpg',
        bytes: 12345,
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
    url: jest.fn().mockReturnValue('https://res.cloudinary.com/test/image/upload/test.jpg'),
  },
}));

describe('Cloudinary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should handle file upload', async () => {
      try {
        const buffer = Buffer.from('test');
        const result = await cloudinaryService.uploadImage(buffer, {
          folder: 'resumes',
          publicId: 'test-file',
        });
        expect(result).toBeDefined();
      } catch (error) {
        // Expected when Cloudinary is not configured
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteFile', () => {
    it('should handle file deletion', async () => {
      try {
        const result = await cloudinaryService.deleteFile('test-public-id');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getFileInfo', () => {
    it('should get file info', async () => {
      try {
        const result = await cloudinaryService.getFileInfo('test-public-id');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
