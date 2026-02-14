import mongoose from 'mongoose';

/**
 * Test database utilities for managing MongoDB connections in tests
 */

let isConnected = false;

/**
 * Connect to test database
 */
export const connectTestDatabase = async () => {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
  
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
};

/**
 * Disconnect from test database
 */
export const disconnectTestDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Test database disconnection error:', error);
    throw error;
  }
};

/**
 * Clear all collections in test database
 */
export const clearTestDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;
  
  // Delete in specific order to avoid foreign key issues
  const collectionOrder = ['interviews', 'resumes', 'users'];
  
  for (const collectionName of collectionOrder) {
    if (collections[collectionName]) {
      await collections[collectionName].deleteMany({});
    }
  }
  
  // Clean up any remaining collections
  for (const key in collections) {
    if (!collectionOrder.includes(key)) {
      await collections[key].deleteMany({});
    }
  }
};

/**
 * Drop test database (use with caution)
 */
export const dropTestDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await mongoose.connection.dropDatabase();
  console.log('Test database dropped');
};
