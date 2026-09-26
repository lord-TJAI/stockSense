'use strict';

const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

/**
 * Connect to MongoDB Atlas.
 * Uses the MONGODB_URI from env config.
 */
async function connectDB() {
  if (isConnected) return;

  if (!env.MONGODB_URI) {
    throw new Error('[DB] MONGODB_URI is not set. Please configure it in .env');
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: 'stocksense',
    });

    isConnected = true;
    console.log(`[DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB (used in tests).
 */
async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[DB] Disconnected from MongoDB');
}

module.exports = { connectDB, disconnectDB };
