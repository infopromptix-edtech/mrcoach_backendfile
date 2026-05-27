const User = require('../models/User');
const Referral = require('../models/Referral');
const RewardTransaction = require('../models/RewardTransaction');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');

/**
 * Send a in-app notification to a user
 */
const sendNotification = async (userId, title, description) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      description,
      type: 'reward',
      priority: 'high'
    });

    await UserNotification.create({
      user: userId,
      notification: notification._id,
      status: 'unread'
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Process Referral Rewards when a booking is confirmed or completed and payment is successful
 */
const processBookingReward = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) return false;

    // Check if user is referred by someone
    const referredUser = booking.user;
    if (!referredUser || !referredUser.referredBy) return false;

    // Verify if already rewarded for this referral
    const referral = await Referral.findOne({ referredUser: referredUser._id });
    if (!referral || referral.status === 'REWARDED') return false;

    const referrerId = referredUser.referredBy;
    const referrer = await User.findById(referrerId);
    if (!referrer) return false;

    // Perform rewards trigger
    referral.status = 'REWARDED';
    referral.bookingId = booking._id;
    referral.rewardAmount = 200;
    referral.rewardedAt = new Date();
    await referral.save();

    // 1. Create transaction for Referrer
    await RewardTransaction.create({
      user: referrerId,
      type: 'REFERRAL_REWARD',
      amount: 200,
      status: 'COMPLETED',
      description: `Referral reward for inviting ${referredUser.name}`
    });

    // Update referrer stats
    referrer.referralStats.totalEarned += 200;
    await referrer.save();

    // Send Notification to Referrer
    await sendNotification(
      referrerId,
      'Referral Reward Credited 🎉',
      `₹200 cashback has been added to your wallet for inviting ${referredUser.name}.`
    );

    // 2. Create transaction for Referred User
    await RewardTransaction.create({
      user: referredUser._id,
      type: 'REFERRAL_REWARD',
      amount: 200,
      status: 'COMPLETED',
      description: `Referral reward for completing first booking via invitation by ${referrer.name}`
    });

    // Update referred user stats
    referredUser.referralStats.totalEarned += 200;
    await referredUser.save();

    // Send Notification to Referred User
    await sendNotification(
      referredUser._id,
      'Referral Reward Credited 🎉',
      `₹200 cashback has been added to your wallet.`
    );

    return true;
  } catch (error) {
    console.error('Error processing booking reward:', error);
    return false;
  }
};

module.exports = {
  sendNotification,
  processBookingReward
};
