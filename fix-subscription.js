// Quick script to fix subscription in database
// Run with: node fix-subscription.js YOUR_EMAIL

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const userSchema = new mongoose.Schema({
  email: String,
  subscription: {
    plan: String,
    status: String,
    expiresAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function fixSubscription() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide email: node fix-subscription.js YOUR_EMAIL');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Looking for user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('📋 Current subscription:');
    console.log(`   Plan: ${user.subscription.plan}`);
    console.log(`   Status: ${user.subscription.status}`);
    console.log(`   Expires: ${user.subscription.expiresAt || 'Not set'}\n`);

    // Update to Pro plan
    user.subscription.plan = 'pro';
    user.subscription.status = 'active';
    
    // Set expiry to 1 month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    user.subscription.expiresAt = oneMonthFromNow;

    await user.save();

    console.log('✅ Subscription updated successfully!\n');
    console.log('📋 New subscription:');
    console.log(`   Plan: ${user.subscription.plan}`);
    console.log(`   Status: ${user.subscription.status}`);
    console.log(`   Expires: ${user.subscription.expiresAt.toLocaleDateString()}`);
    console.log('\n🎉 Done! Refresh your browser to see the changes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixSubscription();
