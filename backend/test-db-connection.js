const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB Atlas connection...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      ssl: true,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    await mongoose.connection.close();
    console.log('🔚 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('not authorized')) {
      console.error('🚨 IP WHITELISTING ISSUE:');
      console.error('1. Go to https://cloud.mongodb.com');
      console.error('2. Navigate to Network Access');
      console.error('3. Add your IP address');
      console.error('4. Wait 1-2 minutes and try again');
    }
  }
}

testConnection();