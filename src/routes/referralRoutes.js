const express = require('express');
const router = express.Router();
const {
  getReferralDashboard,
  getReferralHistory,
  getShareLink,
  getAdminReferralStats
} = require('../controllers/referralController');

const { protect, admin } = require('../middleware/authMiddleware');

// Client referral endpoints
router.get('/dashboard', protect, getReferralDashboard);
router.get('/history', protect, getReferralHistory);
router.get('/share-link', protect, getShareLink);

// Administrative stats endpoint
router.get('/admin/stats', protect, admin, getAdminReferralStats);

module.exports = router;
