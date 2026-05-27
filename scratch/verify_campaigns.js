require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const RewardCampaign = require('../src/models/RewardCampaign');
const UserReward = require('../src/models/UserReward');

async function testCampaignsFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Fetch or create a test user
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.create({
        name: 'Test Reward User',
        email: 'testuser@mrcoach.in',
        password: 'password123',
        role: 'user'
      });
      console.log('Created test user:', user.email);
    } else {
      console.log('Using existing test user:', user.email);
    }

    // 2. Clear old test campaigns
    await RewardCampaign.deleteMany({ title: /Test/ });
    await UserReward.deleteMany({ user: user._id });

    // 3. Create a Global Campaign
    const globalCampaign = await RewardCampaign.create({
      title: 'Test Global ₹100 Cashback',
      subTitle: 'Test Cashback',
      rewardAmount: 100,
      theme: 'gold',
      condition: 'On next class booking',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      campaignType: 'global',
      status: 'active'
    });
    console.log('Created Global Campaign:', globalCampaign.title);

    // 4. Create a Single Campaign targeting another user
    const singleCampaign = await RewardCampaign.create({
      title: 'Test Single User Coupon',
      subTitle: 'Test Coupon',
      rewardAmount: 50,
      theme: 'blue',
      condition: 'On next class booking',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      campaignType: 'single',
      targetEmail: user.email,
      status: 'active'
    });
    console.log('Created Single Campaign:', singleCampaign.title);

    // 5. Test getUserRewards logic (synchronization)
    const now = new Date();
    const activeCampaigns = await RewardCampaign.find({
      status: 'active',
      expiryDate: { $gt: now }
    });

    console.log(`Found ${activeCampaigns.length} active campaigns.`);

    for (const campaign of activeCampaigns) {
      let isEligible = false;
      if (campaign.campaignType === 'global') {
        isEligible = true;
      } else if (
        campaign.campaignType === 'single' &&
        campaign.targetEmail &&
        campaign.targetEmail.toLowerCase() === user.email.toLowerCase()
      ) {
        isEligible = true;
      }

      if (isEligible) {
        const existingReward = await UserReward.findOne({
          user: user._id,
          campaign: campaign._id
        });

        if (!existingReward) {
          await UserReward.create({
            user: user._id,
            campaign: campaign._id,
            status: 'pending'
          });
          console.log(`Synchronized reward for user: ${campaign.title}`);
        }
      }
    }

    // 6. Fetch user rewards and verify output formatting
    const rewards = await UserReward.find({ user: user._id }).populate('campaign');
    console.log(`Total synchronized rewards for user: ${rewards.length}`);

    rewards.forEach(r => {
      console.log(`- Reward ID: ${r._id}, Title: ${r.campaign.title}, Status: ${r.status}`);
    });

    // 7. Test Scratch/Claim update status
    if (rewards.length > 0) {
      const rewardToScratch = rewards[0];
      rewardToScratch.status = 'scratched';
      rewardToScratch.scratchedAt = new Date();
      await rewardToScratch.save();
      console.log(`Updated Reward ${rewardToScratch._id} to scratched.`);

      const rewardToClaim = rewards[1] || rewards[0];
      rewardToClaim.status = 'claimed';
      rewardToClaim.claimedAt = new Date();
      if (rewardToClaim.campaign) {
        rewardToClaim.campaign.redeemedCount = (rewardToClaim.campaign.redeemedCount || 0) + 1;
        await rewardToClaim.campaign.save();
      }
      await rewardToClaim.save();
      console.log(`Updated Reward ${rewardToClaim._id} to claimed. Redeemed count updated to ${rewardToClaim.campaign.redeemedCount}.`);
    }

    // Clean up test data to keep database tidy
    await RewardCampaign.deleteMany({ title: /Test/ });
    await UserReward.deleteMany({ user: user._id });
    console.log('Cleanup complete.');

    mongoose.disconnect();
    console.log('Disconnected from MongoDB. Flow works successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

testCampaignsFlow();
