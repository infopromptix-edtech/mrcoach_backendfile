const mongoose = require('mongoose');

const rewardCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a campaign title'],
    default: '₹100 Cashback'
  },
  subTitle: {
    type: String,
    required: [true, 'Please add a campaign subtitle'],
    default: 'Cashback'
  },
  rewardAmount: {
    type: Number,
    required: [true, 'Please add a reward value'],
    default: 100
  },
  theme: {
    type: String,
    enum: ['gold', 'blue', 'green', 'purple', 'red'],
    default: 'gold'
  },
  condition: {
    type: String,
    required: [true, 'Please add a condition'],
    default: 'On next booking'
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date'],
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
  },
  campaignType: {
    type: String,
    enum: ['single', 'global'],
    default: 'global'
  },
  targetEmail: {
    type: String, // relevant only if campaignType is 'single'
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active'
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: 1
  },
  redeemedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const RewardCampaign = mongoose.model('RewardCampaign', rewardCampaignSchema);
module.exports = RewardCampaign;
