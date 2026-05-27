const mongoose = require('mongoose');

const fraudAttemptSchema = new mongoose.Schema({
  email: {
    type: String
  },
  deviceId: {
    type: String
  },
  ipAddress: {
    type: String
  },
  type: {
    type: String,
    enum: ['SAME_DEVICE_REFERRAL', 'SELF_REFERRAL', 'DUPLICATE_PHONE', 'DUPLICATE_EMAIL', 'MULTIPLE_REWARDS'],
    required: true
  },
  details: {
    type: String
  }
}, {
  timestamps: true
});

const FraudAttempt = mongoose.model('FraudAttempt', fraudAttemptSchema);
module.exports = FraudAttempt;
