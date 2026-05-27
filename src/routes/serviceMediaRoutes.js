const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllServiceMedia,
  getServiceMediaByServiceId,
  upsertServiceMedia,
  deleteServiceMedia
} = require('../controllers/serviceMediaController');

// Admin CMS endpoints
router.route('/admin')
  .get(protect, admin, getAllServiceMedia)
  .post(protect, admin, upsertServiceMedia);

router.delete('/admin/:id', protect, admin, deleteServiceMedia);

// Client app: get by service ID
router.get('/:serviceId', getServiceMediaByServiceId);

module.exports = router;
