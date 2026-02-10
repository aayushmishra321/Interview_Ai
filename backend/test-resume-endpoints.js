/**
 * Test script for Resume endpoints
 * Tests the fixed resume upload, download, and latest endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
let authToken = '';
let resumeId = '';

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
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
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
      log('✓ Login successful', 'green');
      log(`Token: ${authToken.substring(0, 20)}...`, 'blue');
      return true;
    } else {
      log('✗ Login failed: No token received', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Login failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testResumeUpload() {
  logSection('TEST 2: Resume Upload');
  
  try {
    // Create a dummy PDF file for testing
    const testFilePath = path.join(__dirname, 'test-resume.pdf');
    const testContent = Buffer.from('%PDF-1.4\nTest Resume Content\n%%EOF');
    fs.writeFileSync(testFilePath, testContent);

    const formData = new FormData();
    formData.append('resume', fs.createReadStream(testFilePath), {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });

    const response = await axios.post(
      `${BASE_URL}/api/resume/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    // Clean up test file
    fs.unlinkSync(testFilePath);

    if (response.data.success && response.data.data) {
      resumeId = response.data.data._id || response.data.data.id;
      log('✓ Resume upload successful', 'green');
      log(`Resume ID: ${resumeId}`, 'blue');
      log(`Score: ${response.data.data.score}`, 'blue');
      log(`Content Quality: ${response.data.data.contentQuality}`, 'blue');
      log(`Formatting: ${response.data.data.formatting}`, 'blue');
      log(`Keywords: ${response.data.data.keywords}`, 'blue');
      log(`Impact: ${response.data.data.impact}`, 'blue');
      log(`Skills: ${response.data.data.extractedSkills?.length || 0}`, 'blue');
      return true;
    } else {
      log('✗ Resume upload failed: Invalid response', 'red');
      log(`Response: ${JSON.stringify(response.data)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`✗ Resume upload failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testGetLatestResume() {
  logSection('TEST 3: Get Latest Resume');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/resume/latest`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      log('✓ Get latest resume successful', 'green');
      
      if (response.data.data) {
        log(`Resume ID: ${response.data.data._id}`, 'blue');
        log(`Filename: ${response.data.data.fileName}`, 'blue');
        log(`Score: ${response.data.data.score}`, 'blue');
        log(`Content Quality: ${response.data.data.contentQuality}`, 'blue');
        log(`Formatting: ${response.data.data.formatting}`, 'blue');
        log(`Keywords: ${response.data.data.keywords}`, 'blue');
        log(`Impact: ${response.data.data.impact}`, 'blue');
        log(`Suggestions: ${response.data.data.suggestions?.length || 0}`, 'blue');
        
        // Verify suggestions format
        if (response.data.data.suggestions && response.data.data.suggestions.length > 0) {
          const firstSuggestion = response.data.data.suggestions[0];
          if (typeof firstSuggestion === 'object' && firstSuggestion.title) {
            log('✓ Suggestions have correct format (objects with title/description)', 'green');
          } else {
            log('✗ Suggestions have incorrect format', 'red');
            log(`First suggestion: ${JSON.stringify(firstSuggestion)}`, 'yellow');
          }
        }
      } else {
        log('No resume data found', 'yellow');
      }
      return true;
    } else {
      log('✗ Get latest resume failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Get latest resume failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testGetResumeById() {
  logSection('TEST 4: Get Resume by ID');
  
  if (!resumeId) {
    log('⊘ Skipping - no resume ID available', 'yellow');
    return true;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/resume/${resumeId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success && response.data.data) {
      log('✓ Get resume by ID successful', 'green');
      log(`Resume ID: ${response.data.data._id}`, 'blue');
      log(`Filename: ${response.data.data.filename}`, 'blue');
      return true;
    } else {
      log('✗ Get resume by ID failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Get resume by ID failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function testDownloadResume() {
  logSection('TEST 5: Download Resume');
  
  if (!resumeId) {
    log('⊘ Skipping - no resume ID available', 'yellow');
    return true;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/resume/${resumeId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );

    if (response.status === 302 || response.status === 301) {
      log('✓ Download endpoint returns redirect', 'green');
      log(`Redirect URL: ${response.headers.location}`, 'blue');
      return true;
    } else if (response.status === 200) {
      log('✓ Download endpoint returns file directly', 'green');
      return true;
    } else {
      log(`✗ Unexpected status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response && (error.response.status === 302 || error.response.status === 301)) {
      log('✓ Download endpoint returns redirect', 'green');
      log(`Redirect URL: ${error.response.headers.location}`, 'blue');
      return true;
    }
    
    log(`✗ Download failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

async function runTests() {
  log('\n🧪 Resume Endpoints Test Suite', 'cyan');
  log(`Testing API at: ${BASE_URL}`, 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Run tests sequentially
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Resume Upload', fn: testResumeUpload },
    { name: 'Get Latest Resume', fn: testGetLatestResume },
    { name: 'Get Resume by ID', fn: testGetResumeById },
    { name: 'Download Resume', fn: testDownloadResume }
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
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
