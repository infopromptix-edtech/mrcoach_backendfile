const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');

dotenv.config();

const resetAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    let admin = await User.findOne({ email: 'admin@mrcoach.in' });
    const newPassword = 'adminpassword123';

    if (!admin) {
      console.log('Admin user not found. Seeding admin user...');
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@mrcoach.in',
        password: newPassword,
        role: 'admin'
      });
      console.log('Seeded successfully!');
    } else {
      console.log('Admin user found. Resetting password...');
      admin.password = newPassword;
      await admin.save();
      console.log('Reset successfully!');
    }

    console.log('\n--- ADMIN LOGIN CREDENTIALS ---');
    console.log(`Email:    admin@mrcoach.in`);
    console.log(`Password: ${newPassword}`);
    console.log('-------------------------------\n');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdmin();
