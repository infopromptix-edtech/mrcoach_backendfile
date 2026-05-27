const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Service = require('../src/models/Service');

async function checkServices() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  try {
    const services = await Service.find({});
    console.log(`Total services in DB: ${services.length}`);
    services.forEach(s => {
      console.log(`- Title: "${s.title}", Category: "${s.category}"`);
    });
  } catch (error) {
    console.error('Error fetching services:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Done!');
  }
}

checkServices();
