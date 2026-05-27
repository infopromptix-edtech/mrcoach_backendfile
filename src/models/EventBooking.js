const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  user_name: {
    type: String,
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  verified_mobile_number: {
    type: String,
    required: true
  },
  event_id: {
    type: String,
    required: true
  },
  event_title: {
    type: String,
    required: true
  },
  booking_id: {
    type: String,
    default: null
  },
  website_order_id: {
    type: String,
    default: null
  },
  payment_gateway_order_id: {
    type: String,
    default: null
  },
  payment_id: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    required: true
  },
  amount_paid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  ticket_quantity: {
    type: Number,
    default: 1
  },
  booking_date_time: {
    type: Date,
    required: true
  },
  event_date: {
    type: Date,
    default: null
  },
  booking_source: {
    type: String,
    default: 'website'
  },
  sync_status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventBooking', eventBookingSchema);
