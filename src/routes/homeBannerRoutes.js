const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getActiveBanners,
  adminGetBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} = require('../controllers/homeBannerController');

// Client app active banners
router.get('/active', getActiveBanners);

// Admin CMS endpoints
router.route('/admin')
  .get(protect, admin, adminGetBanners)
  .post(protect, admin, createBanner);

router.route('/admin/:id')
  .put(protect, admin, updateBanner)
  .delete(protect, admin, deleteBanner);

router.put('/admin/:id/toggle', protect, admin, toggleBannerStatus);

module.exports = router;
