/**
 * CREATE ADMIN USER SCRIPT
 * Run this script to create an admin user in the database
 * 
 * Usage: node create-admin-user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin user credentials
const ADMIN_EMAIL = 'admin@smartinterview.ai';
const ADMIN_PASSWORD = 'Admin123!@#';
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB');

    // Import User model from compiled dist folder
    const User = require('./dist/models/User').default;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${ADMIN_EMAIL}`);
      
      // Update to admin role if not already
      if (existingAdmin.auth.role !== 'admin') {
        existingAdmin.auth.role = 'admin';
        existingAdmin.auth.isVerified = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }
      
      console.log('\n📝 Admin Login Credentials:');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
      console.log('\n🌐 Login at: http://localhost:5175/login');
      
      await mongoose.connection.close();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      profile: {
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        avatar: null,
        phone: null,
        location: 'System',
      },
      preferences: {
        role: 'System Administrator',
        experienceLevel: 'executive',
        industries: ['Technology', 'Management'],
        interviewTypes: ['behavioral', 'technical', 'coding', 'system-design'],
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        expiresAt: null, // Never expires for admin
      },
      auth: {
        isVerified: true,
        role: 'admin', // IMPORTANT: Set admin role
        verificationToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogin: null,
        loginAttempts: 0,
        lockUntil: null,
      },
      stats: {
        totalInterviews: 0,
        averageScore: 0,
        improvementRate: 0,
        lastInterviewDate: null,
      },
    });

    // Save admin user
    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login URL: http://localhost:5175/login');
    console.log('🎯 Admin Dashboard: http://localhost:5175/admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n💡 TIP: Save these credentials in a secure location');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Setup complete!');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('IP')) {
      console.error('\n🚨 IP WHITELISTING ISSUE:');
      console.error('Please add your IP to MongoDB Atlas Network Access');
    }
    
    process.exit(1);
  }
}

// Run the script
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         SMART INTERVIEW AI - ADMIN USER SETUP                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

createAdminUser();
