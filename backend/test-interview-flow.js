/**
 * Test Script for Priority 1 Interview Flow
 * 
 * This script tests the complete interview flow:
 * 1. Create interview with resume-based questions
 * 2. Start interview session
 * 3. Get next question
 * 4. Submit response
 * 5. End interview
 * 6. Generate feedback
 * 
 * Usage: node test-interview-flow.js <AUTH_TOKEN>
 */

const BASE_URL = 'http://localhost:5001';

async function testInterviewFlow(authToken) {
  console.log('🧪 Testing Priority 1 Interview Flow\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Create Interview
    console.log('\n📝 Test 1: Create Interview with Resume-Based Questions');
    const createResponse = await fetch(`${BASE_URL}/api/interview/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        type: 'technical',
        settings: {
          role: 'Full Stack Developer',
          difficulty: 'medium',
          duration: 30,
          includeVideo: true,
          includeAudio: true
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Create interview failed: ${JSON.stringify(error)}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Interview created successfully');
    console.log(`   Interview ID: ${createData.data._id}`);
    console.log(`   Questions generated: ${createData.data.questions.length}`);
    console.log(`   Status: ${createData.data.status}`);
    
    const interviewId = createData.data._id;
    const firstQuestion = createData.data.questions[0];

    // Test 2: Start Interview
    console.log('\n🚀 Test 2: Start Interview Session');
    const startResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        deviceInfo: 'Test Script',
        networkQuality: 'excellent'
      })
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(`Start interview failed: ${JSON.stringify(error)}`);
    }

    const startData = await startResponse.json();
    console.log('✅ Interview started successfully');
    console.log(`   Session ID: ${startData.data.id}`);
    console.log(`   Status: ${startData.data.status}`);
    console.log(`   Start time: ${startData.data.startTime}`);

    // Test 3: Get Next Question
    console.log('\n❓ Test 3: Get Next Question');
    const questionResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/next-question`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!questionResponse.ok) {
      const error = await questionResponse.json();
      throw new Error(`Get question failed: ${JSON.stringify(error)}`);
    }

    const questionData = await questionResponse.json();
    console.log('✅ Question retrieved successfully');
    console.log(`   Question ID: ${questionData.data.id}`);
    console.log(`   Question: ${questionData.data.text.substring(0, 80)}...`);
    console.log(`   Type: ${questionData.data.type}`);
    console.log(`   Difficulty: ${questionData.data.difficulty}`);

    // Test 4: Submit Response
    console.log('\n💬 Test 4: Submit Response with AI Analysis');
    const responseResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        questionId: firstQuestion.id,
        answer: 'In my previous role at Tech Corp, I led a team of 5 developers to build a scalable e-commerce platform using React, Node.js, and MongoDB. We implemented microservices architecture and achieved 99.9% uptime. The project increased sales by 40% and reduced page load time by 60%. I used agile methodologies and conducted daily stand-ups to ensure smooth collaboration.',
        duration: 180
      })
    });

    if (!responseResponse.ok) {
      const error = await responseResponse.json();
      throw new Error(`Submit response failed: ${JSON.stringify(error)}`);
    }

    const responseData = await responseResponse.json();
    console.log('✅ Response submitted and analyzed successfully');
    console.log(`   Analysis completed: ${responseData.data.success}`);
    if (responseData.data.analysis) {
      console.log(`   Overall score: ${responseData.data.analysis.overallScore}`);
      console.log(`   Relevance: ${responseData.data.analysis.scores.relevance}`);
      console.log(`   Technical accuracy: ${responseData.data.analysis.scores.technicalAccuracy}`);
      console.log(`   Clarity: ${responseData.data.analysis.scores.clarity}`);
    }
    console.log(`   Questions remaining: ${responseData.data.questionsRemaining}`);

    // Wait a bit before ending
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: End Interview
    console.log('\n🏁 Test 5: End Interview Session');
    const endResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!endResponse.ok) {
      const error = await endResponse.json();
      throw new Error(`End interview failed: ${JSON.stringify(error)}`);
    }

    const endData = await endResponse.json();
    console.log('✅ Interview ended successfully');
    console.log(`   Status: ${endData.data.status}`);
    console.log(`   Duration: ${endData.data.session.actualDuration} minutes`);

    // Test 6: Generate Feedback
    console.log('\n📊 Test 6: Generate AI Feedback');
    const feedbackResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!feedbackResponse.ok) {
      const error = await feedbackResponse.json();
      throw new Error(`Generate feedback failed: ${JSON.stringify(error)}`);
    }

    const feedbackData = await feedbackResponse.json();
    console.log('✅ Feedback generated successfully');
    console.log(`   Overall rating: ${feedbackData.data.overallRating}/100`);
    console.log(`   Strengths: ${feedbackData.data.strengths.length}`);
    console.log(`   Improvements: ${feedbackData.data.improvements.length}`);
    console.log(`   Recommendations: ${feedbackData.data.recommendations.length}`);

    // Test 7: Get Analysis
    console.log('\n📈 Test 7: Get Interview Analysis');
    const analysisResponse = await fetch(`${BASE_URL}/api/interview/${interviewId}/analysis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.json();
      throw new Error(`Get analysis failed: ${JSON.stringify(error)}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('✅ Analysis retrieved successfully');
    console.log(`   Overall score: ${analysisData.data.overallScore}`);
    console.log(`   Content metrics available: ${!!analysisData.data.contentMetrics}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Priority 1 Implementation Verified:');
    console.log('   ✓ Interview creation with resume-based questions');
    console.log('   ✓ Session management (start/end)');
    console.log('   ✓ Question retrieval');
    console.log('   ✓ Response submission with AI analysis');
    console.log('   ✓ Interview completion');
    console.log('   ✓ Feedback generation');
    console.log('   ✓ Analysis retrieval');
    console.log('\n📝 Interview ID for reference:', interviewId);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run tests
const authToken = process.argv[2];

if (!authToken) {
  console.error('❌ Error: Auth token required');
  console.log('\nUsage: node test-interview-flow.js <AUTH_TOKEN>');
  console.log('\nTo get auth token:');
  console.log('1. Login to the application');
  console.log('2. Open browser console');
  console.log('3. Run: localStorage.getItem("accessToken")');
  console.log('4. Copy the token and use it here');
  process.exit(1);
}

testInterviewFlow(authToken);
