const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getServices) // Public: Everyone can view services
  .post(protect, admin, createService); // Admin only: Can create new services

router.route('/:id')
  .get(getServiceById) // Public
  .put(protect, admin, updateService) // Admin only
  .delete(protect, admin, deleteService); // Admin only

module.exports = router;
