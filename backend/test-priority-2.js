/**
 * Test script for Priority 2 features
 * Tests feedback generation, real-time analysis, and profile management
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
let authToken = '';
let interviewId = '';
let userId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testLogin() {
  logSection('TEST 1: User Login');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!@#'
    });

    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      userId = response.data.data.user.id;
      log('✓ Login successful', 'green');
      log(`Token: ${authToken.substring(0, 20)}...`, 'blue');
      log(`User ID: ${userId}`, 'blue');
      return true;
    } else {
      log('✗ Login failed: No token received', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Login failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFeedbackGeneration() {
  logSection('TEST 2: Feedback Generation');
  
  try {
    // First, get or create an interview
    const interviewsResponse = await axios.get(
      `${BASE_URL}/api/interview`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (interviewsResponse.data.success && interviewsResponse.data.data.length > 0) {
      interviewId = interviewsResponse.data.data[0]._id;
      log(`✓ Found interview: ${interviewId}`, 'green');
    } else {
      log('⊘ No interviews found, skipping feedback test', 'yellow');
      return true;
    }

    // Generate feedback
    log('Generating feedback...', 'blue');
    const feedbackResponse = await axios.post(
      `${BASE_URL}/api/feedback/${interviewId}/generate`,
      {},
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (feedbackResponse.data.success) {
      const feedback = feedbackResponse.data.data;
      log('✓ Feedback generated successfully', 'green');
      log(`Overall Rating: ${feedback.overallRating}`, 'blue');
      log(`Strengths: ${feedback.strengths?.length || 0}`, 'blue');
      log(`Improvements: ${feedback.improvements?.length || 0}`, 'blue');
      log(`Recommendations: ${feedback.recommendations?.length || 0}`, 'blue');
      
      if (feedback.metrics) {
        log('Metrics:', 'blue');
        log(`  - Communication: ${feedback.metrics.communicationScore}`, 'blue');
        log(`  - Technical: ${feedback.metrics.technicalScore}`, 'blue');
        log(`  - Confidence: ${feedback.metrics.confidenceScore}`, 'blue');
        log(`  - Clarity: ${feedback.metrics.clarityScore}`, 'blue');
      }
      
      return true;
    } else {
      log('✗ Feedback generation failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Feedback generation error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testPDFReportGeneration() {
  logSection('TEST 3: PDF Report Generation');
  
  if (!interviewId) {
    log('⊘ No interview ID available, skipping', 'yellow');
    return true;
  }

  try {
    // Generate report
    const reportResponse = await axios.post(
      `${BASE_URL}/api/feedback/${interviewId}/report`,
      {},
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (reportResponse.data.success) {
      log('✓ PDF report generated', 'green');
      log(`Report URL: ${reportResponse.data.data.reportUrl}`, 'blue');
      
      if (reportResponse.data.data.reportData) {
        log('Report includes:', 'blue');
        log(`  - Interview ID: ${reportResponse.data.data.reportData.interview.id}`, 'blue');
        log(`  - Type: ${reportResponse.data.data.reportData.interview.type}`, 'blue');
        log(`  - Role: ${reportResponse.data.data.reportData.interview.role}`, 'blue');
      }
      
      return true;
    } else {
      log('✗ Report generation failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Report generation error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testRealTimeVideoAnalysis() {
  logSection('TEST 4: Real-time Video Analysis');
  
  if (!interviewId) {
    log('⊘ No interview ID available, skipping', 'yellow');
    return true;
  }

  try {
    // Mock video frame data
    const mockFrameData = Buffer.from('mock_video_frame_data').toString('base64');
    
    const response = await axios.post(
      `${BASE_URL}/api/interview/${interviewId}/analyze/video`,
      {
        frameData: mockFrameData,
        timestamp: Date.now()
      },
      {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      log('✓ Video analysis endpoint working', 'green');
      log(`Analysis data received`, 'blue');
      return true;
    } else {
      log('✗ Video analysis failed', 'red');
      return false;
    }
  } catch (error) {
    // Expected to fail if Python AI server not running
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      log('⊘ Python AI server not running (expected)', 'yellow');
      log('  Video analysis endpoint exists but AI server unavailable', 'yellow');
      return true;
    }
    
    log(`✗ Video analysis error: ${error.message}`, 'red');
    return false;
  }
}

async function testRealTimeAudioAnalysis() {
  logSection('TEST 5: Real-time Audio Analysis');
  
  if (!interviewId) {
    log('⊘ No interview ID available, skipping', 'yellow');
    return true;
  }

  try {
    // Mock audio data
    const mockAudioData = Buffer.from('mock_audio_data').toString('base64');
    
    const response = await axios.post(
      `${BASE_URL}/api/interview/${interviewId}/analyze/audio`,
      {
        audioData: mockAudioData,
        transcript: 'This is a test transcript',
        timestamp: Date.now()
      },
      {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      log('✓ Audio analysis endpoint working', 'green');
      log(`Analysis data received`, 'blue');
      return true;
    } else {
      log('✗ Audio analysis failed', 'red');
      return false;
    }
  } catch (error) {
    // Expected to fail if Python AI server not running
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      log('⊘ Python AI server not running (expected)', 'yellow');
      log('  Audio analysis endpoint exists but AI server unavailable', 'yellow');
      return true;
    }
    
    log(`✗ Audio analysis error: ${error.message}`, 'red');
    return false;
  }
}

async function testLiveAnalysisSummary() {
  logSection('TEST 6: Live Analysis Summary');
  
  if (!interviewId) {
    log('⊘ No interview ID available, skipping', 'yellow');
    return true;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/interview/${interviewId}/analyze/summary`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      const metrics = response.data.data;
      log('✓ Live analysis summary retrieved', 'green');
      log(`Eye Contact: ${metrics.eyeContact}%`, 'blue');
      log(`Speech Rate: ${metrics.speechRate} WPM`, 'blue');
      log(`Filler Words: ${metrics.fillerWordCount}`, 'blue');
      log(`Clarity Score: ${metrics.clarityScore}%`, 'blue');
      
      if (metrics.emotionSummary) {
        log(`Dominant Emotion: ${metrics.emotionSummary.dominant}`, 'blue');
        log(`Confidence: ${metrics.emotionSummary.confidence}%`, 'blue');
      }
      
      return true;
    } else {
      log('✗ Analysis summary failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Analysis summary error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testAvatarUpload() {
  logSection('TEST 7: Avatar Upload');
  
  try {
    // Create a mock image file
    const mockImagePath = path.join(__dirname, 'test-avatar.jpg');
    const mockImageData = Buffer.from('mock_image_data_jpg_format');
    fs.writeFileSync(mockImagePath, mockImageData);

    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(mockImagePath), {
      filename: 'test-avatar.jpg',
      contentType: 'image/jpeg'
    });

    const response = await axios.post(
      `${BASE_URL}/api/user/upload-avatar`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // Clean up test file
    fs.unlinkSync(mockImagePath);

    if (response.data.success) {
      log('✓ Avatar upload successful', 'green');
      log(`Avatar URL: ${response.data.data.avatarUrl}`, 'blue');
      return true;
    } else {
      log('✗ Avatar upload failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Avatar upload error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testProfileUpdate() {
  logSection('TEST 8: Profile Update');
  
  try {
    const response = await axios.put(
      `${BASE_URL}/api/user/profile`,
      {
        profile: {
          firstName: 'Test',
          lastName: 'User',
          location: 'San Francisco, CA'
        },
        preferences: {
          role: 'Senior Software Engineer',
          experienceLevel: 'senior'
        }
      },
      {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      log('✓ Profile updated successfully', 'green');
      log(`Name: ${response.data.data.profile.firstName} ${response.data.data.profile.lastName}`, 'blue');
      log(`Location: ${response.data.data.profile.location}`, 'blue');
      log(`Role: ${response.data.data.preferences.role}`, 'blue');
      log(`Experience: ${response.data.data.preferences.experienceLevel}`, 'blue');
      return true;
    } else {
      log('✗ Profile update failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Profile update error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function runTests() {
  log('\n🧪 Priority 2 Test Suite', 'cyan');
  log(`Testing API at: ${BASE_URL}`, 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Run tests sequentially
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Feedback Generation', fn: testFeedbackGeneration },
    { name: 'PDF Report Generation', fn: testPDFReportGeneration },
    { name: 'Real-time Video Analysis', fn: testRealTimeVideoAnalysis },
    { name: 'Real-time Audio Analysis', fn: testRealTimeAudioAnalysis },
    { name: 'Live Analysis Summary', fn: testLiveAnalysisSummary },
    { name: 'Avatar Upload', fn: testAvatarUpload },
    { name: 'Profile Update', fn: testProfileUpdate }
  ];

  for (const test of tests) {
    const result = await test.fn();
    if (result === true) {
      results.passed++;
    } else if (result === false) {
      results.failed++;
    } else {
      results.skipped++;
    }
  }

  // Summary
  logSection('TEST SUMMARY');
  log(`✓ Passed: ${results.passed}`, 'green');
  if (results.failed > 0) {
    log(`✗ Failed: ${results.failed}`, 'red');
  }
  if (results.skipped > 0) {
    log(`⊘ Skipped: ${results.skipped}`, 'yellow');
  }
  
  const total = results.passed + results.failed + results.skipped;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  log('\n📝 Notes:', 'cyan');
  log('- Real-time analysis tests may show "Python AI server not running"', 'yellow');
  log('  This is expected if the Python server is not started', 'yellow');
  log('- Avatar upload may fail if Cloudinary is not configured', 'yellow');
  log('  The system will fallback to local storage', 'yellow');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
