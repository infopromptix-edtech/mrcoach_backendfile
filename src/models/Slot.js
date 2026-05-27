const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: {
    type: String, // e.g. "2026-05-23"
    required: true
  },
  time: {
    type: String, // e.g. "10:00 AM"
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  serviceName: {
    type: String, // Optional: if this slot is tied to a specific service
    default: 'General'
  }
}, {
  timestamps: true
});

const Slot = mongoose.model('Slot', slotSchema);
module.exports = Slot;
