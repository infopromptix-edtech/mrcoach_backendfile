const User = require('../models/User');
const Referral = require('../models/Referral');
const FraudAttempt = require('../models/FraudAttempt');
const RewardTransaction = require('../models/RewardTransaction');

/**
 * @desc    Get user's referral dashboard details
 * @route   GET /api/referrals/dashboard
 * @access  Private
 */
const getReferralDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count statistics directly from database
    const invited = await Referral.countDocuments({ referrer: userId });
    const joined = await Referral.countDocuments({ referrer: userId, status: 'REWARDED' });
    const pendingCount = await Referral.countDocuments({ referrer: userId, status: 'SIGNED_UP' });
    
    const earned = joined * 200;
    const pending = pendingCount * 200;

    res.status(200).json({
      code: req.user.referralCode || '',
      invited,
      joined,
      earned,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user's referral invitation history
 * @route   GET /api/referrals/history
 * @access  Private
 */
const getReferralHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await Referral.find({ referrer: userId })
      .populate('referredUser', 'name email profileImage')
      .populate('bookingId', 'serviceName date price status')
      .sort({ createdAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Generate user's referral share link
 * @route   GET /api/referrals/share-link
 * @access  Private
 */
const getShareLink = async (req, res) => {
  try {
    const shareLink = `https://mrcoach.in/signup?ref=${req.user.referralCode}`;
    res.status(200).json({ shareLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get administrative referral analytics & fraud reports
 * @route   GET /api/referrals/admin/stats
 * @access  Private/Admin
 */
const getAdminReferralStats = async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments({});
    const rewardedCount = await Referral.countDocuments({ status: 'REWARDED' });
    const totalRewardsDistributed = rewardedCount * 200;
    const pendingCount = await Referral.countDocuments({ status: 'SIGNED_UP' });
    const pendingRewards = pendingCount * 200;

    const topReferrers = await User.find({ 'referralStats.totalJoined': { $gt: 0 } })
      .sort({ 'referralStats.totalJoined': -1 })
      .limit(10)
      .select('name email referralStats');

    const fraudAttemptsCount = await FraudAttempt.countDocuments({});
    const fraudAttempts = await FraudAttempt.find({}).sort({ createdAt: -1 }).limit(20);

    const conversionRate = totalReferrals > 0 ? (rewardedCount / totalReferrals) * 100 : 0;

    res.status(200).json({
      totalReferrals,
      totalRewardsDistributed,
      pendingRewards,
      topReferrers,
      fraudAttemptsCount,
      fraudAttempts,
      conversionRate: parseFloat(conversionRate.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReferralDashboard,
  getReferralHistory,
  getShareLink,
  getAdminReferralStats
};
