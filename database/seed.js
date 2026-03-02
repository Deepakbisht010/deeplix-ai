// Database Seed Script - Creates demo data for testing
require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-ai';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Import models
  const User = require('../backend/src/models/User');
  const Task = require('../backend/src/models/Task');

  // Create demo user
  const existing = await User.findOne({ email: 'demo@nexusai.com' });
  if (!existing) {
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@nexusai.com',
      password: 'demo123456',
      preferences: { theme: 'dark', aiPersonality: 'friendly' }
    });

    // Create sample tasks
    await Task.insertMany([
      { user: user._id, title: 'Review Q4 strategy document', priority: 'high', category: 'Work', status: 'todo' },
      { user: user._id, title: 'Set up team standup meeting', priority: 'medium', category: 'Work', status: 'in-progress' },
      { user: user._id, title: 'Learn TypeScript basics', priority: 'low', category: 'Learning', status: 'todo' },
      { user: user._id, title: 'Update portfolio website', priority: 'medium', category: 'Personal', status: 'completed' },
      { user: user._id, title: 'Read "Deep Work" book', priority: 'low', category: 'Learning', status: 'todo' },
    ]);

    console.log('✅ Demo user created: demo@nexusai.com / demo123456');
  } else {
    console.log('ℹ️ Demo user already exists');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
