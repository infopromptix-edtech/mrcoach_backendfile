const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['REFERRAL_REWARD', 'SCRATCH_CARD', 'ADMIN_BONUS', 'REDEEMED'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const RewardTransaction = mongoose.model('RewardTransaction', rewardTransactionSchema);
module.exports = RewardTransaction;
