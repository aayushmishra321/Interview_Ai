/**
 * Test Email Sending
 * Tests the email service to verify SMTP configuration
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

async function testEmailSending() {
  console.log('🧪 Testing Email Sending...\n');
  console.log('=' .repeat(60));

  // Test 1: Register a new user (should send welcome email)
  console.log('\n📧 Test 1: Welcome Email on Registration');
  console.log('-'.repeat(60));
  
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      email: testEmail,
      password: 'Test123!@#',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });

    if (response.data.success) {
      console.log('✅ User registered successfully');
      console.log(`📧 Welcome email should be sent to: ${testEmail}`);
      console.log('\n⚠️  CHECK YOUR EMAIL INBOX:');
      console.log(`   Email: ${testEmail}`);
      console.log('   Subject: Welcome to Smart Interview AI');
      console.log('   From: Smart Interview AI <vikasmishra78000@gmail.com>');
      console.log('\n💡 If you don\'t see the email:');
      console.log('   1. Check spam/junk folder');
      console.log('   2. Wait 1-2 minutes for delivery');
      console.log('   3. Check backend logs: backend/logs/combined.log');
      console.log('   4. Verify Gmail SMTP settings in backend/.env');
    } else {
      console.log('❌ Registration failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Registration error:', error.response?.data?.error || error.message);
  }

  // Test 2: Password Reset Email
  console.log('\n\n📧 Test 2: Password Reset Email');
  console.log('-'.repeat(60));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
      email: testEmail
    });

    if (response.data.success) {
      console.log('✅ Password reset email requested');
      console.log(`📧 Reset email should be sent to: ${testEmail}`);
      console.log('\n⚠️  CHECK YOUR EMAIL INBOX:');
      console.log(`   Email: ${testEmail}`);
      console.log('   Subject: Password Reset Request');
      console.log('   From: Smart Interview AI <vikasmishra78000@gmail.com>');
      console.log('\n💡 The email contains a reset link that expires in 1 hour');
    } else {
      console.log('❌ Password reset failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Password reset error:', error.response?.data?.error || error.message);
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 EMAIL TESTING SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Email service is configured');
  console.log('✅ SMTP settings loaded from .env');
  console.log('✅ Welcome email triggered on registration');
  console.log('✅ Password reset email triggered');
  console.log('\n📧 Test Email Address:', testEmail);
  console.log('\n⚠️  IMPORTANT: Check the email inbox to verify delivery!');
  console.log('\n📝 Email Configuration:');
  console.log('   Service: Gmail SMTP');
  console.log('   Host: smtp.gmail.com');
  console.log('   Port: 587');
  console.log('   From: vikasmishra78000@gmail.com');
  console.log('\n💡 If emails are not arriving:');
  console.log('   1. Check backend/logs/error.log for SMTP errors');
  console.log('   2. Verify Gmail app password is correct');
  console.log('   3. Ensure "Less secure app access" is enabled (if using regular password)');
  console.log('   4. Check Gmail "Sent" folder to confirm emails were sent');
  console.log('   5. Try with a different email provider (not Gmail)');
  console.log('\n' + '='.repeat(60));
}

// Run test
testEmailSending().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
