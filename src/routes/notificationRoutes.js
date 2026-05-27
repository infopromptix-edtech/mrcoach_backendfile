const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  updateNotificationStatus,
  createNotification,
  adminGetNotifications,
  adminToggleNotificationStatus,
  adminDeleteNotification,
  adminGetAnalytics
} = require('../controllers/notificationController');

// User notifications endpoints
router.route('/')
  .get(protect, getUserNotifications);

router.route('/:id/status')
  .put(protect, updateNotificationStatus);

// Admin-only notification CMS endpoints
router.route('/admin')
  .post(protect, admin, createNotification)
  .get(protect, admin, adminGetNotifications);

router.route('/admin/analytics')
  .get(protect, admin, adminGetAnalytics);

router.route('/admin/:id')
  .delete(protect, admin, adminDeleteNotification);

router.route('/admin/:id/status')
  .put(protect, admin, adminToggleNotificationStatus);

module.exports = router;
