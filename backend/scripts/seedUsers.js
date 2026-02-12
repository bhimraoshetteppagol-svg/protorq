const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@evolutionapi.ipbubyl.mongodb.net/Protorq?appName=EvolutionAPI';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB - Protorq database');

    // Clear existing users in the collection
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create users as specified
    const users = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('123', 10),
        role: 'admin'
      },
      {
        email: 'employee@example.com',
        password: await bcrypt.hash('123', 10),
        role: 'employee'
      },
      {
        email: 'user@example.com',
        password: await bcrypt.hash('123', 10),
        role: 'user'
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log('Seed completed! All users added to Protorq database.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();

