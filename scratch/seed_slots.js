const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Slot = require('../src/models/Slot');

// Load environment variables from backend directory
dotenv.config();

const timeSlots = [
  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
];

const seedSlots = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Slot Seeding...');

    // Clear existing slots first
    await Slot.deleteMany({});
    console.log('Cleared existing slots.');

    const slotsToInsert = [];
    
    // Start date: May 22, 2026
    const startDate = new Date('2026-05-22');
    // End date: June 30, 2026
    const endDate = new Date('2026-06-30');

    let current = new Date(startDate);
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      timeSlots.forEach(t => {
        slotsToInsert.push({
          date: dateStr,
          time: t,
          isAvailable: true,
          capacity: 2,
          serviceName: 'General'
        });
      });

      current.setDate(current.getDate() + 1);
    }

    console.log(`Prepared ${slotsToInsert.length} slots for insertion...`);
    
    // Insert in chunks to avoid max payload issues
    const chunkSize = 100;
    for (let i = 0; i < slotsToInsert.length; i += chunkSize) {
      const chunk = slotsToInsert.slice(i, i + chunkSize);
      await Slot.insertMany(chunk);
      console.log(`Inserted slots ${i + 1} to ${Math.min(i + chunkSize, slotsToInsert.length)}`);
    }

    console.log('Successfully created all 24-hour slots until the end of June!');
    process.exit();
  } catch (err) {
    console.error('Error seeding slots:', err);
    process.exit(1);
  }
};

seedSlots();
