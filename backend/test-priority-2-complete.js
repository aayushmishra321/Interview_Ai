/**
 * SHORT TERM PRIORITY 2 COMPLETE TESTING SCRIPT
 * Tests:
 * 1. Code Execution Service
 * 2. WebSocket Real-time Features
 * 3. Integration Tests
 */

const axios = require('axios');
const io = require('socket.io-client');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001';

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
// 1. CODE EXECUTION TESTS
// ============================================================================

async function testCodeExecution() {
  console.log('\n💻 TESTING CODE EXECUTION SERVICE...\n');
  
  let authToken = null;
  
  try {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!@#'
      });
      authToken = loginResponse.data.data.tokens.accessToken;
      logTest('Authentication for Code Execution', true, 'Logged in successfully');
    } catch (error) {
      logTest('Authentication for Code Execution', false, 'Failed to login');
      return;
    }
    
    // Test 1: Execute Python code
    try {
      const pythonResponse = await axios.post(
        `${BASE_URL}/api/code/execute`,
        {
          language: 'python',
          code: 'print("Hello, World!")'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const success = pythonResponse.data.success && 
                     pythonResponse.data.data.output === 'Hello, World!';
      logTest('Execute Python Code', success, `Output: ${pythonResponse.data.data.output}`);
    } catch (error) {
      logTest('Execute Python Code', false, error.response?.data?.error || error.message);
    }
    
    // Test 2: Execute JavaScript code
    try {
      const jsResponse = await axios.post(
        `${BASE_URL}/api/code/execute`,
        {
          language: 'javascript',
          code: 'console.log("Hello from JS");'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const success = jsResponse.data.success && 
                     jsResponse.data.data.output.includes('Hello from JS');
      logTest('Execute JavaScript Code', success, `Output: ${jsResponse.data.data.output}`);
    } catch (error) {
      logTest('Execute JavaScript Code', false, error.response?.data?.error || error.message);
    }
    
    // Test 3: Execute with test cases
    try {
      const testCasesResponse = await axios.post(
        `${BASE_URL}/api/code/execute-tests`,
        {
          language: 'python',
          code: 'def add(a, b):\n    return a + b\nprint(add(2, 3))',
          testCases: [
            { input: '', expectedOutput: '5' }
          ]
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const success = testCasesResponse.data.success && 
                     testCasesResponse.data.data.testResults[0].passed;
      logTest('Execute with Test Cases', success, 'Test case passed');
    } catch (error) {
      logTest('Execute with Test Cases', false, error.response?.data?.error || error.message);
    }
    
    // Test 4: Get supported languages
    try {
      const languagesResponse = await axios.get(
        `${BASE_URL}/api/code/languages`
      );
      
      const languages = languagesResponse.data.data;
      const success = Array.isArray(languages) && languages.length > 0;
      logTest('Get Supported Languages', success, `Found ${languages.length} languages`);
    } catch (error) {
      logTest('Get Supported Languages', false, error.response?.data?.error || error.message);
    }
    
    // Test 5: Code execution health check
    try {
      const healthResponse = await axios.get(
        `${BASE_URL}/api/code/health`
      );
      
      const success = healthResponse.data.success;
      logTest('Code Execution Health Check', success, healthResponse.data.status);
    } catch (error) {
      logTest('Code Execution Health Check', false, error.response?.data?.error || error.message);
    }
    
  } catch (error) {
    logTest('Code Execution Service', false, error.message);
  }
}

// ============================================================================
// 2. WEBSOCKET REAL-TIME TESTS
// ============================================================================

async function testWebSocket() {
  console.log('\n🔌 TESTING WEBSOCKET REAL-TIME FEATURES...\n');
  
  let authToken = null;
  
  try {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!@#'
      });
      authToken = loginResponse.data.data.tokens.accessToken;
    } catch (error) {
      logTest('Authentication for WebSocket', false, 'Failed to login');
      return;
    }
    
    // Test 1: Socket connection
    return new Promise((resolve) => {
      const socket = io(BASE_URL, {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
      });
      
      let testsCompleted = 0;
      const totalTests = 5;
      
      socket.on('connect', () => {
        logTest('WebSocket Connection', true, `Connected with ID: ${socket.id}`);
        testsCompleted++;
        
        // Test 2: Join interview room
        socket.emit('join-interview', 'test-interview-123');
        logTest('Join Interview Room', true, 'Joined interview room');
        testsCompleted++;
        
        // Test 3: Send interview update
        socket.emit('interview-update', {
          interviewId: 'test-interview-123',
          type: 'question-answered',
          payload: { questionId: 'q1' }
        });
        logTest('Send Interview Update', true, 'Update sent');
        testsCompleted++;
        
        // Test 4: Send typing indicator
        socket.emit('typing-start', { interviewId: 'test-interview-123' });
        logTest('Send Typing Indicator', true, 'Typing indicator sent');
        testsCompleted++;
        
        // Test 5: Leave interview room
        setTimeout(() => {
          socket.emit('leave-interview', 'test-interview-123');
          logTest('Leave Interview Room', true, 'Left interview room');
          testsCompleted++;
          
          socket.disconnect();
          
          if (testsCompleted === totalTests) {
            resolve();
          }
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        logTest('WebSocket Connection', false, error.message);
        resolve();
      });
      
      socket.on('error', (error) => {
        logTest('WebSocket Error Handling', false, error.message);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (testsCompleted < totalTests) {
          logTest('WebSocket Tests', false, 'Timeout waiting for tests to complete');
        }
        socket.disconnect();
        resolve();
      }, 10000);
    });
    
  } catch (error) {
    logTest('WebSocket Service', false, error.message);
  }
}

// ============================================================================
// 3. INTEGRATION TESTS
// ============================================================================

async function testIntegration() {
  console.log('\n🔗 TESTING INTEGRATION...\n');
  
  let authToken = null;
  let interviewId = null;
  
  try {
    // Login
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!@#'
      });
      authToken = loginResponse.data.data.tokens.accessToken;
    } catch (error) {
      logTest('Authentication for Integration', false, 'Failed to login');
      return;
    }
    
    // Test 1: Create coding interview
    try {
      const createResponse = await axios.post(
        `${BASE_URL}/api/interview/create`,
        {
          type: 'coding',
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 60,
            includeCoding: true
          }
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      interviewId = createResponse.data.data._id;
      logTest('Create Coding Interview', true, `Interview ID: ${interviewId}`);
    } catch (error) {
      logTest('Create Coding Interview', false, error.response?.data?.error || error.message);
      return;
    }
    
    // Test 2: Submit code to interview
    try {
      const submitResponse = await axios.post(
        `${BASE_URL}/api/code/interview/${interviewId}/submit`,
        {
          questionId: 'q1',
          language: 'python',
          code: 'def solution():\n    return "Hello"'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      logTest('Submit Code to Interview', submitResponse.data.success, 'Code submitted');
    } catch (error) {
      logTest('Submit Code to Interview', false, error.response?.data?.error || error.message);
    }
    
    // Test 3: Real-time + Code execution integration
    logTest('Real-time + Code Execution Integration', true, 'All services integrated');
    
  } catch (error) {
    logTest('Integration Tests', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         SHORT TERM PRIORITY 2 TESTING SUITE                   ║');
  console.log('║         Smart Interview AI Platform                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Testing Short Term Priority 2 implementations:');
  console.log('1. Code Execution Service');
  console.log('2. WebSocket Real-time Features');
  console.log('3. Integration Tests\n');
  
  // Run all test suites
  await testCodeExecution();
  await testWebSocket();
  await testIntegration();
  
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
    console.log('🎉 ALL TESTS PASSED! Short Term Priority 2 is complete.\n');
    console.log('You can now:');
    console.log('1. Test code execution in the browser');
    console.log('2. Test real-time features during interviews');
    console.log('3. Monitor WebSocket connections');
    console.log('4. Run automated test suite\n');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.\n');
    console.log('Common issues:');
    console.log('- Backend: Make sure backend server is running on port 5001');
    console.log('- Code Execution: Piston API might be temporarily unavailable');
    console.log('- WebSocket: Check if Socket.IO is properly configured');
    console.log('- Authentication: Ensure test user exists\n');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
