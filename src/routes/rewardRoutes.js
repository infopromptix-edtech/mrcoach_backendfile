const express = require('express');
const router = express.Router();
const {
  getUserRewards,
  updateRewardStatus,
  getRewardsStatus,
  createCampaign,
  getCampaigns,
  toggleCampaignStatus,
  deleteCampaign
} = require('../controllers/rewardController');

const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getUserRewards);

router.route('/status')
  .get(getRewardsStatus);

router.route('/:id')
  .put(protect, updateRewardStatus);

// Admin-only endpoints
router.route('/admin/campaigns')
  .post(protect, admin, createCampaign)
  .get(protect, admin, getCampaigns);

router.route('/admin/campaigns/:id')
  .delete(protect, admin, deleteCampaign);

router.route('/admin/campaigns/:id/status')
  .put(protect, admin, toggleCampaignStatus);

module.exports = router;
