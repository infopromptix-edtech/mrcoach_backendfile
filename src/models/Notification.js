const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // If null, this is an admin-created campaign/global notification
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  message: {
    type: String // Fallback alias for backward compatibility with automated reward notifications
  },
  bannerImage: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['promotion', 'reward', 'event', 'booking', 'reminder', 'announcement', 'offer', 'alert', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  redirectUrl: {
    type: String,
    default: ''
  },
  targetAudience: {
    type: String,
    enum: ['all', 'selected', 'premium', 'new', 'pending_booking', 'completed_booking'],
    default: 'all'
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  ctaText: {
    type: String,
    default: ''
  },
  // Analytics counters
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  openedCount: {
    type: Number,
    default: 0
  },
  clickedCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Middleware to keep message and description in sync
notificationSchema.pre('save', function () {
  if (this.description && !this.message) {
    this.message = this.description;
  } else if (this.message && !this.description) {
    this.description = this.message;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
