const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Test credentials (use your actual test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234'
};

async function testInterviewCreation() {
  console.log('=== TESTING INTERVIEW CREATION ===\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');
    if (token) {
      console.log('   Token:', token.substring(0, 20) + '...\n');
    } else {
      console.log('   Token: (present)\n');
    }

    // Step 2: Create Interview
    console.log('2. Creating interview...');
    const interviewData = {
      type: 'behavioral',
      settings: {
        role: 'Software Engineer',
        difficulty: 'medium',
        duration: 30,
        includeVideo: true,
        includeAudio: true,
        includeCoding: false
      }
    };

    console.log('   Interview data:', JSON.stringify(interviewData, null, 2));

    const createResponse = await axios.post(
      `${API_URL}/interview/create`,
      interviewData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!createResponse.data.success) {
      throw new Error('Interview creation failed: ' + createResponse.data.message);
    }

    console.log('✅ Interview created successfully!');
    console.log('   Interview ID:', createResponse.data.data._id);
    console.log('   Type:', createResponse.data.data.type);
    console.log('   Status:', createResponse.data.data.status);
    console.log('   Questions:', createResponse.data.data.questions.length);
    console.log('\n📝 First 3 questions:');
    
    createResponse.data.data.questions.slice(0, 3).forEach((q, i) => {
      console.log(`\n   ${i + 1}. ${q.text}`);
      console.log(`      Type: ${q.type}, Difficulty: ${q.difficulty}`);
      console.log(`      Duration: ${q.expectedDuration} min`);
    });

    console.log('\n=== TEST PASSED ✅ ===');
    console.log('You can now start the interview with ID:', createResponse.data.data._id);

  } catch (error) {
    console.error('\n=== TEST FAILED ❌ ===');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testInterviewCreation();
