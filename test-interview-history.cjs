/**
 * Test script to verify interview history is working correctly
 * This tests the complete flow from login to viewing history
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5001';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234',
};

let authToken = null;
let userId = null;

async function login() {
  console.log('\n=== STEP 1: LOGIN ===');
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.tokens) {
      authToken = response.data.data.tokens.accessToken;
      userId = response.data.data.user._id || response.data.data.user.id;
      console.log('✅ Login successful');
      console.log('User ID:', userId);
      console.log('Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function getInterviewHistory() {
  console.log('\n=== STEP 2: GET INTERVIEW HISTORY ===');
  try {
    const response = await axios.get(`${API_URL}/api/interview/history`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        page: 1,
        limit: 100,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response data structure:', Object.keys(response.data));
    console.log('Success:', response.data.success);
    console.log('Data type:', typeof response.data.data);
    console.log('Data is array:', Array.isArray(response.data.data));
    
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ Interview history retrieved');
      console.log('Total interviews:', response.data.data.length);
      console.log('Pagination:', response.data.pagination);
      
      if (response.data.data.length > 0) {
        console.log('\nFirst interview sample:');
        const interview = response.data.data[0];
        console.log('  ID:', interview._id || interview.id);
        console.log('  Type:', interview.type);
        console.log('  Status:', interview.status);
        console.log('  Role:', interview.settings?.role);
        console.log('  Created:', interview.createdAt);
        console.log('  Questions:', interview.questions?.length || 0);
        console.log('  Responses:', interview.responses?.length || 0);
      }
      
      return response.data.data;
    } else {
      console.error('❌ Unexpected response format:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Get history error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return null;
  }
}

async function createTestInterview() {
  console.log('\n=== STEP 3: CREATE TEST INTERVIEW ===');
  try {
    const payload = {
      type: 'behavioral',
      settings: {
        role: 'Software Engineer',
        difficulty: 'medium',
        duration: 30,
        includeVideo: true,
        includeAudio: true,
        includeCoding: false,
      },
    };
    
    console.log('Creating interview with payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_URL}/api/interview/create`, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success && response.data.data) {
      const interview = response.data.data;
      const interviewId = interview._id || interview.id;
      console.log('✅ Interview created');
      console.log('Interview ID:', interviewId);
      console.log('Type:', interview.type);
      console.log('Status:', interview.status);
      console.log('Questions generated:', interview.questions?.length || 0);
      return interviewId;
    } else {
      console.error('❌ Interview creation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Create interview error:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     INTERVIEW HISTORY INTEGRATION TEST                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ TEST FAILED: Could not login');
    process.exit(1);
  }
  
  // Step 2: Get existing history
  const existingHistory = await getInterviewHistory();
  if (existingHistory === null) {
    console.error('\n❌ TEST FAILED: Could not retrieve history');
    process.exit(1);
  }
  
  const initialCount = existingHistory.length;
  console.log(`\nInitial interview count: ${initialCount}`);
  
  // Step 3: Create a new interview
  const newInterviewId = await createTestInterview();
  if (!newInterviewId) {
    console.error('\n❌ TEST FAILED: Could not create interview');
    process.exit(1);
  }
  
  // Step 4: Get history again to verify new interview appears
  console.log('\n=== STEP 4: VERIFY NEW INTERVIEW IN HISTORY ===');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  const updatedHistory = await getInterviewHistory();
  if (updatedHistory === null) {
    console.error('\n❌ TEST FAILED: Could not retrieve updated history');
    process.exit(1);
  }
  
  const finalCount = updatedHistory.length;
  console.log(`\nFinal interview count: ${finalCount}`);
  
  if (finalCount > initialCount) {
    console.log('✅ New interview appears in history');
    
    // Verify the new interview is in the list
    const foundInterview = updatedHistory.find(i => 
      (i._id || i.id) === newInterviewId
    );
    
    if (foundInterview) {
      console.log('✅ New interview found in history list');
      console.log('   ID:', foundInterview._id || foundInterview.id);
      console.log('   Type:', foundInterview.type);
      console.log('   Status:', foundInterview.status);
    } else {
      console.error('❌ New interview not found in history list');
      process.exit(1);
    }
  } else {
    console.error('❌ Interview count did not increase');
    console.error(`   Expected: > ${initialCount}, Got: ${finalCount}`);
    process.exit(1);
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ✅ ALL TESTS PASSED                                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ TEST SUITE FAILED:', error);
  process.exit(1);
});
