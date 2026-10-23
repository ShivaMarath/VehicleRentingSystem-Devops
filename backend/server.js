const mongoose = require('mongoose');
const app = require('./app');
const Vehicle = require('./models/Vehicle');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vehicle_rental';

const seed = async () => {
  if (await Vehicle.countDocuments() > 0) return;
  await Vehicle.insertMany([
    { name: 'Toyota Innova', type: 'SUV', seats: 7, pricePerDay: 90, emoji: '🚙' },
    { name: 'Honda City', type: 'Car', seats: 5, pricePerDay: 60, emoji: '🚗' },
    { name: 'Hyundai i20', type: 'Car', seats: 5, pricePerDay: 45, emoji: '🚘' },
    { name: 'Royal Enfield Classic', type: 'Bike', seats: 2, pricePerDay: 25, emoji: '🏍️' },
    { name: 'Tempo Traveller', type: 'Van', seats: 12, pricePerDay: 150, emoji: '🚐' }
  ]);
  console.log('Seeded sample vehicles');
};

const start = async () => {
  for (let i = 1; i <= 10; i++) {
    try {
      await mongoose.connect(MONGO_URI);
      break;
    } catch (err) {
      console.log(`Mongo not ready (attempt ${i}/10), retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
      if (i === 10) process.exit(1);
    }
  }
  console.log('Connected to MongoDB');
  await seed();
  app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
};

start();
