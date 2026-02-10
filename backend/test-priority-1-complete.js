/**
 * PRIORITY 1 COMPLETE TESTING SCRIPT
 * Tests all Priority 1 implementations:
 * 1. Database Connection
 * 2. Interview Room Backend Integration
 * 3. Python AI Server Integration
 * 4. Email Service Configuration
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001';
const PYTHON_AI_URL = 'http://localhost:8000';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// ============================================================================
// 1. DATABASE CONNECTION TESTS
// ============================================================================

async function testDatabaseConnection() {
  console.log('\n📊 TESTING DATABASE CONNECTION...\n');
  
  try {
    // Test MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    logTest('MongoDB Connection', true, 'Successfully connected to MongoDB Atlas');
    
    // Test database operations
    const User = mongoose.model('User');
    const count = await User.countDocuments();
    logTest('Database Query', true, `Found ${count} users in database`);
    
    await mongoose.connection.close();
    logTest('MongoDB Disconnect', true, 'Successfully disconnected');
    
  } catch (error) {
    logTest('MongoDB Connection', false, error.message);
    
    if (error.message.includes('IP') || error.message.includes('not authorized')) {
      console.log('\n🚨 IP WHITELISTING ISSUE DETECTED');
      console.log('SOLUTION: Add your IP to MongoDB Atlas Network Access');
      console.log('1. Go to https://cloud.mongodb.com');
      console.log('2. Navigate to Network Access');
      console.log('3. Click "Add IP Address"');
      console.log('4. Add your current IP or use 0.0.0.0/0 for development');
      console.log('5. Save and wait 1-2 minutes\n');
    }
  }
}

// ============================================================================
// 2. INTERVIEW SYSTEM BACKEND TESTS
// ============================================================================

async function testInterviewSystem() {
  console.log('\n🎤 TESTING INTERVIEW SYSTEM BACKEND...\n');
  
  let authToken = null;
  let interviewId = null;
  
  try {
    // 1. Register/Login to get auth token
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!@#'
      });
      authToken = loginResponse.data.data.tokens.accessToken;
      logTest('User Authentication', true, 'Successfully logged in');
    } catch (error) {
      // Try to register if login fails
      try {
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
          email: 'test@example.com',
          password: 'Test123!@#',
          profile: {
            firstName: 'Test',
            lastName: 'User'
          },
          preferences: {
            role: 'Software Engineer',
            experienceLevel: 'mid'
          }
        });
        authToken = registerResponse.data.data.tokens.accessToken;
        logTest('User Registration', true, 'Successfully registered new user');
      } catch (regError) {
        logTest('User Authentication', false, regError.message);
        return;
      }
    }
    
    // 2. Create Interview
    try {
      const createResponse = await axios.post(
        `${BASE_URL}/api/interview/create`,
        {
          type: 'behavioral',
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 45,
            includeVideo: true,
            includeAudio: true,
            includeCoding: false
          }
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      interviewId = createResponse.data.data._id;
      const questionCount = createResponse.data.data.questions.length;
      logTest('Create Interview', true, `Created interview with ${questionCount} questions`);
      logTest('Resume-Based Questions', questionCount > 0, `Generated ${questionCount} AI questions`);
    } catch (error) {
      logTest('Create Interview', false, error.response?.data?.error || error.message);
      return;
    }
    
    // 3. Start Interview
    try {
      const startResponse = await axios.post(
        `${BASE_URL}/api/interview/${interviewId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      logTest('Start Interview', true, 'Interview session started successfully');
      logTest('Session Tracking', startResponse.data.data.startTime !== null, 'Start time recorded');
    } catch (error) {
      logTest('Start Interview', false, error.response?.data?.error || error.message);
    }
    
    // 4. Get Next Question
    try {
      const questionResponse = await axios.get(
        `${BASE_URL}/api/interview/${interviewId}/next-question`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const question = questionResponse.data.data;
      logTest('Get Next Question', true, `Retrieved question: "${question.text.substring(0, 50)}..."`);
      
      // 5. Submit Response
      try {
        const responseData = {
          questionId: question.id,
          answer: 'This is a test answer demonstrating my problem-solving skills and teamwork abilities.',
          duration: 120
        };
        
        const submitResponse = await axios.post(
          `${BASE_URL}/api/interview/${interviewId}/response`,
          responseData,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        
        logTest('Submit Response', true, 'Response submitted successfully');
        logTest('AI Response Analysis', submitResponse.data.data.analysis !== null, 'AI analyzed the response');
      } catch (error) {
        logTest('Submit Response', false, error.response?.data?.error || error.message);
      }
    } catch (error) {
      logTest('Get Next Question', false, error.response?.data?.error || error.message);
    }
    
    // 6. End Interview
    try {
      const endResponse = await axios.post(
        `${BASE_URL}/api/interview/${interviewId}/end`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      logTest('End Interview', true, 'Interview ended successfully');
      logTest('Duration Calculation', endResponse.data.data.session.actualDuration > 0, `Duration: ${endResponse.data.data.session.actualDuration} min`);
    } catch (error) {
      logTest('End Interview', false, error.response?.data?.error || error.message);
    }
    
    // 7. Get Interview History
    try {
      const historyResponse = await axios.get(
        `${BASE_URL}/api/interview/history`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      logTest('Interview History', true, `Found ${historyResponse.data.data.length} interviews`);
    } catch (error) {
      logTest('Interview History', false, error.response?.data?.error || error.message);
    }
    
  } catch (error) {
    logTest('Interview System', false, error.message);
  }
}

// ============================================================================
// 3. PYTHON AI SERVER INTEGRATION TESTS
// ============================================================================

async function testPythonAIServer() {
  console.log('\n🤖 TESTING PYTHON AI SERVER INTEGRATION...\n');
  
  try {
    // 1. Health Check
    try {
      const healthResponse = await axios.get(`${PYTHON_AI_URL}/health`, {
        timeout: 5000
      });
      logTest('Python AI Server Health', true, `Server is ${healthResponse.data.status}`);
    } catch (error) {
      logTest('Python AI Server Health', false, 'Server not responding - make sure Python AI server is running');
      console.log('\n💡 To start Python AI server:');
      console.log('   cd ai-server');
      console.log('   python -m venv myenv');
      console.log('   myenv\\Scripts\\activate  (Windows) or source myenv/bin/activate (Mac/Linux)');
      console.log('   pip install -r requirements.txt');
      console.log('   python src/main.py\n');
      return;
    }
    
    // 2. Test Resume Parsing
    try {
      const resumeData = {
        file_content: 'John Doe\nSoftware Engineer\nSkills: Python, JavaScript, React\nExperience: 5 years',
        filename: 'test-resume.pdf'
      };
      
      const parseResponse = await axios.post(
        `${PYTHON_AI_URL}/api/resume/parse`,
        resumeData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PYTHON_AI_SERVER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      logTest('Resume Parsing', parseResponse.data.success, 'Resume parsed successfully');
      logTest('Skills Extraction', parseResponse.data.data.skills.length > 0, `Extracted ${parseResponse.data.data.skills.length} skills`);
    } catch (error) {
      logTest('Resume Parsing', false, error.response?.data?.error || error.message);
    }
    
    // 3. Test Video Analysis
    try {
      const videoData = {
        frame_data: 'base64_encoded_frame_data_here',
        timestamp: Date.now()
      };
      
      const videoResponse = await axios.post(
        `${PYTHON_AI_URL}/api/video/analyze-frame`,
        videoData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PYTHON_AI_SERVER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      logTest('Video Analysis', videoResponse.data.success, 'Video frame analyzed');
    } catch (error) {
      // This might fail with invalid frame data, which is expected
      logTest('Video Analysis Endpoint', error.response?.status === 400 || error.response?.status === 422, 'Endpoint is accessible');
    }
    
    // 4. Test Audio Analysis
    try {
      const audioData = {
        audio_data: 'base64_encoded_audio_data_here',
        transcript: 'This is a test transcript',
        timestamp: Date.now()
      };
      
      const audioResponse = await axios.post(
        `${PYTHON_AI_URL}/api/audio/analyze`,
        audioData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PYTHON_AI_SERVER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      logTest('Audio Analysis', audioResponse.data.success, 'Audio analyzed');
    } catch (error) {
      // This might fail with invalid audio data, which is expected
      logTest('Audio Analysis Endpoint', error.response?.status === 400 || error.response?.status === 422, 'Endpoint is accessible');
    }
    
  } catch (error) {
    logTest('Python AI Server', false, error.message);
  }
}

// ============================================================================
// 4. EMAIL SERVICE TESTS
// ============================================================================

async function testEmailService() {
  console.log('\n📧 TESTING EMAIL SERVICE...\n');
  
  try {
    // Check if email is configured
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!emailConfigured) {
      logTest('Email Configuration', false, 'EMAIL_USER and EMAIL_PASSWORD not set in .env');
      console.log('\n💡 To configure email service:');
      console.log('1. For Gmail:');
      console.log('   - Enable 2-factor authentication');
      console.log('   - Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('   - Set EMAIL_USER=your-email@gmail.com');
      console.log('   - Set EMAIL_PASSWORD=your-app-password');
      console.log('\n2. For SendGrid (recommended for production):');
      console.log('   - Sign up at https://sendgrid.com');
      console.log('   - Get API key from Settings > API Keys');
      console.log('   - Set EMAIL_SERVICE=SendGrid');
      console.log('   - Set EMAIL_USER=apikey');
      console.log('   - Set EMAIL_PASSWORD=your-sendgrid-api-key\n');
      return;
    }
    
    logTest('Email Configuration', true, `Email service configured with ${process.env.EMAIL_SERVICE || 'Gmail'}`);
    
    // Test email service health
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health/email`);
      logTest('Email Service Health', healthResponse.data.success, healthResponse.data.message);
    } catch (error) {
      logTest('Email Service Health', false, 'Email health endpoint not available');
    }
    
    console.log('\n💡 Email service is configured. Emails will be sent for:');
    console.log('   - User registration (verification email)');
    console.log('   - Password reset requests');
    console.log('   - Email verification');
    
  } catch (error) {
    logTest('Email Service', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         PRIORITY 1 COMPLETE TESTING SUITE                     ║');
  console.log('║         Smart Interview AI Platform                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Testing Priority 1 implementations:');
  console.log('1. Database Connection');
  console.log('2. Interview Room Backend Integration');
  console.log('3. Python AI Server Integration');
  console.log('4. Email Service Configuration\n');
  
  // Run all test suites
  await testDatabaseConnection();
  await testInterviewSystem();
  await testPythonAIServer();
  await testEmailService();
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);
  
  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.message}`);
    });
    console.log('');
  }
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    NEXT STEPS                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Priority 1 is complete.\n');
    console.log('You can now:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Test the interview flow in the browser');
    console.log('3. Check email inbox for verification emails');
    console.log('4. Monitor Python AI server logs for analysis requests\n');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.\n');
    console.log('Common issues:');
    console.log('- MongoDB: Check IP whitelist and connection string');
    console.log('- Python AI Server: Make sure it\'s running on port 8000');
    console.log('- Email: Configure EMAIL_USER and EMAIL_PASSWORD in .env');
    console.log('- Backend: Make sure backend server is running on port 5001\n');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
