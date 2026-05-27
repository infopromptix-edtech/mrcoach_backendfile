const RewardCampaign = require('../models/RewardCampaign');
const UserReward = require('../models/UserReward');
const User = require('../models/User');
const Config = require('../models/Config');
const Notification = require('../models/Notification');

// Helper to auto-award reward on booking completion (creates a single campaign)
exports.autoAwardReward = async (userId, earnedFrom) => {
  try {
    const rewardsEnabled = await Config.findOne({ key: 'rewardsEnabled' });
    if (rewardsEnabled && rewardsEnabled.value === false) {
      console.log('Rewards system is disabled globally. Skipping auto-award.');
      return null;
    }

    const user = await User.findById(userId);
    if (!user) return null;

    const campaign = await RewardCampaign.create({
      title: '₹100 Cashback',
      subTitle: 'Booking Completion',
      rewardAmount: 100,
      theme: 'gold',
      condition: 'On next booking',
      campaignType: 'single',
      targetEmail: user.email,
      status: 'active'
    });

    const reward = await UserReward.create({
      user: userId,
      campaign: campaign._id,
      status: 'pending'
    });

    // Create in-app notification
    await Notification.create({
      user: userId,
      title: 'You received a scratch card!',
      message: `You earned a ₹100 cashback scratch card for completing your booking.`,
      type: 'reward'
    });

    return reward;
  } catch (error) {
    console.error('Error auto-awarding reward:', error);
    return null;
  }
};

// @desc    Get logged in user's rewards
// @route   GET /api/rewards
// @access  Private
exports.getUserRewards = async (req, res) => {
  try {
    const now = new Date();
    // 1. Fetch all active campaigns
    const activeCampaigns = await RewardCampaign.find({
      status: 'active',
      expiryDate: { $gt: now }
    });

    // 2. Synchronize rewards for the user
    for (const campaign of activeCampaigns) {
      let isEligible = false;
      if (campaign.campaignType === 'global') {
        isEligible = true;
      } else if (
        campaign.campaignType === 'single' &&
        campaign.targetEmail &&
        campaign.targetEmail.toLowerCase() === req.user.email.toLowerCase()
      ) {
        isEligible = true;
      }

      if (isEligible) {
        // Check if UserReward already exists for this campaign & user
        const existingReward = await UserReward.findOne({
          user: req.user._id,
          campaign: campaign._id
        });

        if (!existingReward) {
          await UserReward.create({
            user: req.user._id,
            campaign: campaign._id,
            status: 'pending'
          });
        }
      }
    }

    // 3. Retrieve all UserRewards
    const rewards = await UserReward.find({ user: req.user._id })
      .populate('campaign')
      .sort({ createdAt: -1 });

        // 4. Format to match previous response schema for frontend compatibility
    const formattedRewards = rewards
      .map(r => {
        if (!r.campaign) return null;
        return {
          _id: r._id,
          id: r._id,
          rewardAmount: r.campaign.rewardAmount,
          title: r.campaign.title,
          subTitle: r.campaign.subTitle,
          condition: r.campaign.condition,
          theme: r.campaign.theme,
          status: r.status,
          expiryDate: r.campaign.expiryDate,
          campaignId: r.campaign._id
        };
      })
      .filter(Boolean);

    res.json(formattedRewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update reward status (scratch or claim)
// @route   PUT /api/rewards/:id
// @access  Private
exports.updateRewardStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'scratched', 'claimed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const reward = await UserReward.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('campaign');

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    reward.status = status;
    if (status === 'scratched') {
      reward.scratchedAt = new Date();
    } else if (status === 'claimed') {
      reward.claimedAt = new Date();
      if (reward.campaign) {
        reward.campaign.redeemedCount = (reward.campaign.redeemedCount || 0) + 1;
        await reward.campaign.save();
      }
    }
    await reward.save();

    res.json({
      _id: reward._id,
      id: reward._id,
      status: reward.status,
      rewardAmount: reward.campaign?.rewardAmount,
      title: reward.campaign?.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Create new reward campaign
// @route   POST /api/rewards/admin/campaigns
// @access  Private/Admin
exports.createCampaign = async (req, res) => {
  try {
    const {
      title,
      subTitle,
      rewardAmount,
      theme,
      condition,
      expiryDate,
      campaignType,
      targetEmail,
      minBookingAmount,
      usageLimit
    } = req.body;

    const campaign = await RewardCampaign.create({
      title,
      subTitle,
      rewardAmount: parseFloat(rewardAmount),
      theme,
      condition,
      expiryDate: new Date(expiryDate),
      campaignType,
      targetEmail: targetEmail || '',
      minBookingAmount: parseFloat(minBookingAmount || 0),
      usageLimit: parseInt(usageLimit || 1),
      status: 'active'
    });

    // Trigger notification
    const notificationMsg = `You received a ${title} scratch card!`;
    if (campaignType === 'global') {
      // 1. Create global in-app notification (user = null)
      await Notification.create({
        user: null,
        title: 'New Reward Campaign!',
        message: notificationMsg,
        type: 'reward'
      });
      console.log('Global notification sent to all users.');
    } else if (campaignType === 'single' && targetEmail) {
      // 2. Create single user notification
      const user = await User.findOne({ email: targetEmail });
      if (user) {
        await UserReward.create({
          user: user._id,
          campaign: campaign._id,
          status: 'pending'
        });
        await Notification.create({
          user: user._id,
          title: 'New Reward Received!',
          message: notificationMsg,
          type: 'reward'
        });
      }
    }

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get all campaigns with analytics
// @route   GET /api/rewards/admin/campaigns
// @access  Private/Admin
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await RewardCampaign.find({}).sort({ createdAt: -1 });
    const totalUsersCount = await User.countDocuments({ role: 'user' });

    const campaignsWithAnalytics = await Promise.all(campaigns.map(async (c) => {
      const isGlobal = c.campaignType === 'global';
      
      // Analytics calculations
      const totalReached = isGlobal ? totalUsersCount : 1;
      const redeemedCount = c.redeemedCount || 0;
      const remainingUsers = Math.max(0, totalReached - redeemedCount);
      const isExpired = new Date() > c.expiryDate;

      return {
        ...c.toObject(),
        totalReached,
        redeemedCount,
        remainingUsers,
        isExpired
      };
    }));

    res.json(campaignsWithAnalytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Pause or Resume a Campaign
// @route   PUT /api/rewards/admin/campaigns/:id/status
// @access  Private/Admin
exports.toggleCampaignStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ message: 'Invalid campaign status' });
    }

    const campaign = await RewardCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = status;
    await campaign.save();

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Delete a Campaign
// @route   DELETE /api/rewards/admin/campaigns/:id
// @access  Private/Admin
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await RewardCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete associated UserRewards
    await UserReward.deleteMany({ campaign: campaign._id });
    await RewardCampaign.deleteOne({ _id: campaign._id });

    res.json({ success: true, message: 'Campaign removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check rewards status config
// @route   GET /api/rewards/status
// @access  Public
exports.getRewardsStatus = async (req, res) => {
  try {
    let rewards = await Config.findOne({ key: 'rewardsEnabled' });
    if (!rewards) {
      rewards = await Config.create({ key: 'rewardsEnabled', value: true });
    }
    res.json({ rewardsEnabled: rewards.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
