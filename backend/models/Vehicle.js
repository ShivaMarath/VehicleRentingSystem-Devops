const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Car', 'SUV', 'Bike', 'Van'], default: 'Car' },
  seats: { type: Number, default: 4 },
  pricePerDay: { type: Number, required: true, min: 0 },
  emoji: { type: String, default: '🚗' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
