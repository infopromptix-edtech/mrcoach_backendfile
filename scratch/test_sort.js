const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Slot = require('../src/models/Slot');

dotenv.config();

const parseTimeToMinutes = (timeStr) => {
  const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    console.log(`Failed to match timeStr: "${timeStr}"`);
    return 0;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  else if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const slots = await Slot.find({ date: '2026-05-22' });
  
  console.log('--- Original slots in database ---');
  slots.forEach(s => console.log(s.time));

  console.log('--- Minutes calculated ---');
  slots.forEach(s => {
    console.log(`time: "${s.time}", minutes: ${parseTimeToMinutes(s.time)}`);
  });

  const slotsCopy = slots.map(s => s.toObject());
  slotsCopy.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });

  console.log('--- Sorted slots ---');
  slotsCopy.forEach(s => console.log(s.time));

  process.exit();
};

test();
