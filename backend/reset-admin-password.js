/**
 * RESET ADMIN PASSWORD SCRIPT
 * Run this script to reset the admin user password
 * 
 * Usage: node reset-admin-password.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Admin credentials
const ADMIN_EMAIL = 'admin@smartinterview.ai';
const NEW_PASSWORD = 'Admin123!@#';

async function resetAdminPassword() {
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

    // Find admin user
    const admin = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Run: node create-admin-user.js first');
      await mongoose.connection.close();
      return;
    }

    console.log('👤 Found admin user');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);

    // Update password (pre-save hook will hash it)
    admin.password = NEW_PASSWORD;
    admin.auth.role = 'admin';
    admin.auth.isVerified = true;
    admin.auth.loginAttempts = 0;
    admin.auth.lockUntil = undefined;
    
    await admin.save();

    console.log('\n✅ Admin password reset successfully!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${NEW_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login URL: http://localhost:5173/admin/login');
    console.log('🎯 Admin Dashboard: http://localhost:5173/admin');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Password reset complete!');

  } catch (error) {
    console.error('\n❌ Error resetting password:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         SMART INTERVIEW AI - RESET ADMIN PASSWORD             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

resetAdminPassword();
