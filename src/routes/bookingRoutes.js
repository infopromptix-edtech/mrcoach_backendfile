const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

// Bring in the security guard!
const { protect } = require('../middleware/authMiddleware');

// Routes mapped to controllers
// Using 'protect' means the user MUST send their token to access these
router.route('/')
  .post(protect, createBooking)
  .get(protect, getBookings);

router.route('/mybookings').get(protect, getMyBookings);

router.route('/:id/status').put(protect, updateBookingStatus);

module.exports = router;
