const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./src/models/Service');

dotenv.config();

const servicesData = [
  // FITNESS
  { title: 'Strength Training', category: 'Fitness', description: 'Build muscle, increase strength & power with progressive overload programs.', price: 500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400' },
  { title: 'Weight Loss', category: 'Fitness', description: 'Lose weight, burn fat & improve overall fitness with science-backed techniques.', price: 500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { title: 'Body Toning', category: 'Fitness', description: 'Sculpt and tone your body with targeted exercises and smart training techniques.', price: 500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400' },
  { title: 'Kids Fitness', category: 'Fitness', description: 'Fun, safe and age-appropriate fitness programs designed for growing children.', price: 400, durationMinutes: 45, imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400' },
  
  // PHYSIO
  { title: 'Back / Neck / Knee Pain', category: 'Physio', description: 'Relieve pain and improve movement with expert physiotherapy care.', price: 1000, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' },
  { title: 'Elderly Care', category: 'Physio', description: 'Personalized support to help seniors stay active and independent.', price: 800, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400' },
  { title: 'Home Physiotherapy', category: 'Physio', description: 'Professional physiotherapy treatment at the comfort of your home.', price: 1500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400' },
  
  // SPORTS
  { title: 'Athletics', category: 'Sports', description: 'Improve speed, stamina, agility, and overall athletic performance.', price: 600, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400' },
  { title: 'Badminton', category: 'Sports', description: 'Enhance reflexes, footwork, and game strategy with expert badminton coaching.', price: 500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400' },
  { title: 'Football', category: 'Sports', description: 'Develop teamwork, stamina, ball control, and match performance.', price: 600, durationMinutes: 90, imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400' },
  
  // YOGA
  { title: 'Meditation', category: 'Yoga', description: 'Practice mindfulness & guided meditation techniques to improve mental clarity.', price: 400, durationMinutes: 45, imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400' },
  { title: 'Power Yoga', category: 'Yoga', description: 'High-energy yoga sessions focused on strength, endurance, flexibility.', price: 500, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400' },
  { title: 'Pre / Post Pregnancy Yoga', category: 'Yoga', description: 'Gentle yoga practices designed to support mothers during pregnancy.', price: 800, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400' },

  // THERAPY
  { title: 'Acupressure', category: 'Therapy', description: 'Stimulate pressure points to reduce pain and improve circulation.', price: 900, durationMinutes: 60, imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400' },
  { title: 'Cupping Therapy', category: 'Therapy', description: 'Improve blood flow, reduce muscle tension, and support recovery.', price: 1200, durationMinutes: 45, imageUrl: 'https://images.unsplash.com/photo-1518611012118-fb8f2f7db0b7?w=400' },
  
  // NUTRITION
  { title: 'Diabetic Diet', category: 'Nutrition', description: 'Balanced meal plans designed to help manage blood sugar levels.', price: 1500, durationMinutes: 30, imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400' },
  { title: 'Weight Loss Diet', category: 'Nutrition', description: 'Healthy and sustainable meal plans designed for effective weight loss.', price: 1500, durationMinutes: 30, imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    await Service.deleteMany(); 
    console.log('Cleared existing services.');

    await Service.insertMany(servicesData);
    console.log('Successfully seeded database with beautiful services!');
    
    process.exit();
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
