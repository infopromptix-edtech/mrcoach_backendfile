const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Notification = require('../src/models/Notification');
const UserNotification = require('../src/models/UserNotification');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mrcoach';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing notifications
    await Notification.deleteMany({ user: null });
    await UserNotification.deleteMany({});
    console.log('Cleaned up previous notifications.');

    const notifs = [
      {
        title: "Welcome to Mr Coach! 🏅",
        description: "This is a premium dynamic broadcast alert sent from our global campaign engine. Explore our elite home yoga & strength services.",
        type: "promotion",
        priority: "high",
        redirectUrl: "services",
        ctaText: "Explore Services",
        targetAudience: "all",
        bannerImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600"
      },
      {
        title: "₹100 Cashback Reward active! 🎁",
        description: "You have a scratch card ready to unlock. Book any personal session to activate.",
        type: "reward",
        priority: "high",
        redirectUrl: "rewards",
        ctaText: "View Rewards",
        targetAudience: "all",
        bannerImage: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600"
      },
      {
        title: "Chennai Rise Up Marathon 🏃‍♂️",
        description: "Join the mega fitness run of the year. Registrations close soon!",
        type: "event",
        priority: "medium",
        redirectUrl: "/events/12",
        ctaText: "Register Now",
        targetAudience: "all",
        bannerImage: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600"
      }
    ];

    const docs = await Notification.insertMany(notifs);
    console.log('Seeded notifications:', docs.length);

    mongoose.connection.close();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
