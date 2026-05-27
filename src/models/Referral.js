const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['INVITED', 'SIGNED_UP', 'BOOKING_COMPLETED', 'REWARDED'],
    default: 'SIGNED_UP'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  rewardedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure a user can only be referred once
referralSchema.index({ referredUser: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);
module.exports = Referral;
