const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./src/models/Event');

dotenv.config();

const eventsData = [
  {
    title: 'NAMMA BESSY MILE RUN 2026',
    slug: 'bessy-mile-run-2026',
    image: 'assets/images/bessy.jpeg',
    startDate: new Date('2026-08-09T05:00:00'),
    endDate: new Date('2026-08-09T11:00:00'),
    location: 'Olcott Memorial Higher Secondary School, Besant Nagar, Chennai',
    price: 600,
    category: 'Fitness',
    websiteUrl: 'https://mrcoach.in/events/15'
  },
  {
    title: 'CHENNAI KIDATHON 2026',
    slug: 'kidathon-2026',
    image: 'assets/images/kidathon.jpeg',
    startDate: new Date('2026-08-02T07:00:00'),
    endDate: new Date('2026-08-02T13:00:00'),
    location: 'Nehru Park, Sports Development Authority of Tamil Nadu, Chennai',
    price: 550,
    category: 'Kids Events',
    websiteUrl: 'https://mrcoach.in/events/14'
  },
  {
    title: 'KIDS & JUNIOR ATHLETICS MEET 2026',
    slug: 'kids-junior-athletics-2026',
    image: 'assets/images/junior.jpeg',
    // Set to a past date so it's dynamically classified as Completed
    startDate: new Date('2026-05-04T07:30:00'),
    endDate: new Date('2026-05-04T18:00:00'),
    location: 'Jawaharlal Nehru Stadium \'A\' Ground, Chennai',
    price: 500,
    category: 'Kids Events',
    websiteUrl: 'https://mrcoach.in/events/13'
  },
  {
    title: 'CHENNAI RISE UP RUN MARATHON',
    slug: 'chennai-rise-up-run-2026',
    image: 'assets/images/chennaievent.jpeg',
    startDate: new Date('2026-05-24T12:00:00'),
    endDate: new Date('2026-05-24T23:59:00'),
    location: 'Decathlon - Mogappair, Chennai',
    price: 299,
    category: 'Marathon',
    websiteUrl: 'https://mrcoach.in/events/12'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Event Seeding...');

    await Event.deleteMany();
    console.log('Cleared existing events.');

    await Event.insertMany(eventsData);
    console.log('Successfully seeded database with beautiful events!');

    process.exit();
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
