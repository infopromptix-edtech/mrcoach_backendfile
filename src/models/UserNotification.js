const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'clicked', 'dismissed'],
    default: 'unread'
  },
  readAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  dismissedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure quick lookups and uniqueness per user/notification combo
userNotificationSchema.index({ user: 1, notification: 1 }, { unique: true });

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
module.exports = UserNotification;
