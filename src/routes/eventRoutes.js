const express = require('express');
const router = express.Router();
const {
  getUpcomingEvents,
  getCompletedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  syncEventBooking
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');
const eventSyncAuth = require('../middleware/eventSyncAuth');

router.route('/upcoming')
  .get(getUpcomingEvents); // Public: Everyone can view upcoming events

router.route('/completed')
  .get(getCompletedEvents); // Public: Everyone can view completed events

router.route('/sync-booking')
  .post(eventSyncAuth, syncEventBooking); // Secure webhook sync route

router.route('/')
  .post(protect, admin, createEvent); // Admin only: Can create new events

router.route('/:id')
  .put(protect, admin, updateEvent) // Admin only
  .delete(protect, admin, deleteEvent); // Admin only

module.exports = router;
