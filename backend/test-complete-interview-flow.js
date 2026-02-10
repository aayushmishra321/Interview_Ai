const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234'
};

async function testCompleteInterviewFlow() {
  console.log('=== TESTING COMPLETE INTERVIEW FLOW ===\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

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

    const createResponse = await axios.post(
      `${API_URL}/interview/create`,
      interviewData,
      { headers }
    );

    const interviewId = createResponse.data.data._id;
    const questions = createResponse.data.data.questions;
    console.log('✅ Interview created successfully!');
    console.log('   Interview ID:', interviewId);
    console.log('   Questions:', questions.length);
    console.log('   Status:', createResponse.data.data.status, '\n');

    // Step 3: Start Interview
    console.log('3. Starting interview session...');
    const startResponse = await axios.post(
      `${API_URL}/interview/${interviewId}/start`,
      {},
      { headers }
    );

    console.log('✅ Interview session started!');
    console.log('   Session ID:', startResponse.data.data.id);
    console.log('   Status:', startResponse.data.data.status);
    console.log('   Total Questions:', startResponse.data.data.totalQuestions, '\n');

    // Step 4: Get First Question
    console.log('4. Getting first question...');
    const questionResponse = await axios.get(
      `${API_URL}/interview/${interviewId}/next-question`,
      { headers }
    );

    const firstQuestion = questionResponse.data.data;
    console.log('✅ First question retrieved!');
    console.log('   Question:', firstQuestion.text);
    console.log('   Type:', firstQuestion.type);
    console.log('   Difficulty:', firstQuestion.difficulty, '\n');

    // Step 5: Submit Answer
    console.log('5. Submitting answer to first question...');
    const answerData = {
      questionId: firstQuestion.id,
      answer: 'I have been working as a Software Engineer for 3 years. My key responsibilities include designing and developing web applications, collaborating with cross-functional teams, writing clean and maintainable code, conducting code reviews, and mentoring junior developers. I focus on creating scalable solutions and following best practices.',
      duration: 3
    };

    const answerResponse = await axios.post(
      `${API_URL}/interview/${interviewId}/response`,
      answerData,
      { headers }
    );

    console.log('✅ Answer submitted successfully!');
    console.log('   Analysis received:', !!answerResponse.data.data.analysis);
    console.log('   Questions remaining:', answerResponse.data.data.questionsRemaining, '\n');

    // Step 6: Get Next Question
    console.log('6. Getting next question...');
    const nextQuestionResponse = await axios.get(
      `${API_URL}/interview/${interviewId}/next-question`,
      { headers }
    );

    const secondQuestion = nextQuestionResponse.data.data;
    console.log('✅ Second question retrieved!');
    console.log('   Question:', secondQuestion.text);
    console.log('   Type:', secondQuestion.type, '\n');

    // Step 7: Submit Second Answer
    console.log('7. Submitting answer to second question...');
    const answer2Data = {
      questionId: secondQuestion.id,
      answer: 'One of the most challenging projects I worked on was building a real-time collaboration platform. The main challenge was handling concurrent updates from multiple users. I approached it by implementing operational transformation algorithms, using WebSockets for real-time communication, and designing a robust conflict resolution system. We also implemented comprehensive testing to ensure data consistency.',
      duration: 4
    };

    await axios.post(
      `${API_URL}/interview/${interviewId}/response`,
      answer2Data,
      { headers }
    );

    console.log('✅ Second answer submitted successfully!\n');

    // Step 8: End Interview
    console.log('8. Ending interview session...');
    const endResponse = await axios.post(
      `${API_URL}/interview/${interviewId}/end`,
      {},
      { headers }
    );

    console.log('✅ Interview session ended!');
    console.log('   Status:', endResponse.data.data.status);
    console.log('   Duration:', endResponse.data.data.session.actualDuration, 'minutes\n');

    // Step 9: Generate Feedback
    console.log('9. Generating feedback...');
    const feedbackResponse = await axios.post(
      `${API_URL}/interview/${interviewId}/feedback`,
      {},
      { headers }
    );

    console.log('✅ Feedback generated successfully!');
    console.log('   Overall Rating:', feedbackResponse.data.data.overallRating);
    console.log('   Strengths:', feedbackResponse.data.data.strengths.length);
    console.log('   Improvements:', feedbackResponse.data.data.improvements.length);
    console.log('   Recommendations:', feedbackResponse.data.data.recommendations.length, '\n');

    // Step 10: Get Interview Details
    console.log('10. Retrieving complete interview details...');
    const detailsResponse = await axios.get(
      `${API_URL}/interview/${interviewId}`,
      { headers }
    );

    const interview = detailsResponse.data.data;
    console.log('✅ Interview details retrieved!');
    console.log('   Type:', interview.type);
    console.log('   Status:', interview.status);
    console.log('   Questions:', interview.questions.length);
    console.log('   Responses:', interview.responses.length);
    console.log('   Has Feedback:', !!interview.feedback);
    console.log('   Has Analysis:', !!interview.analysis, '\n');

    console.log('=== ALL TESTS PASSED ✅ ===');
    console.log('\n🎉 Complete interview flow is working perfectly!');
    console.log('📊 Interview ID:', interviewId);
    console.log('📝 You can now use the frontend to take interviews end-to-end!');

  } catch (error) {
    console.error('\n=== TEST FAILED ❌ ===');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testCompleteInterviewFlow();
