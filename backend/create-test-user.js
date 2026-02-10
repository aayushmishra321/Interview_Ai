const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234',
  name: 'Test User',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    location: 'Test City',
    experience: 3,
    currentRole: 'Software Engineer',
    targetRole: 'Senior Software Engineer',
    skills: ['JavaScript', 'React', 'Node.js']
  }
};

async function createTestUser() {
  console.log('=== CREATING TEST USER ===\n');

  try {
    console.log('Registering user:', TEST_USER.email);
    
    const response = await axios.post(`${API_URL}/auth/register`, TEST_USER);

    if (response.data.success) {
      console.log('✅ User created successfully!');
      console.log('   Email:', TEST_USER.email);
      console.log('   Password:', TEST_USER.password);
      console.log('   User ID:', response.data.data.user._id);
      console.log('\nYou can now use these credentials to test interview creation.');
    } else {
      console.log('⚠️ User creation response:', response.data);
    }

  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.error === 'User already exists') {
      console.log('✅ User already exists!');
      console.log('   Email:', TEST_USER.email);
      console.log('   Password:', TEST_USER.password);
      console.log('\nYou can use these credentials to test interview creation.');
    } else {
      console.error('❌ Error creating user:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
  }
}

createTestUser();
