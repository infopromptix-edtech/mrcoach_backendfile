const mongoose = require('mongoose');

const userRewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'RewardCampaign',
  },
  status: {
    type: String,
    enum: ['pending', 'scratched', 'claimed'],
    default: 'pending',
  },
  scratchedAt: {
    type: Date
  },
  claimedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const UserReward = mongoose.model('UserReward', userRewardSchema);
module.exports = UserReward;
