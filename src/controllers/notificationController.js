const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
const Booking = require('../models/Booking');
const http = require('https');

// Helpers to match notification type to user preferences
const shouldSendNotification = (user, notificationType) => {
  const prefs = user.notificationPreferences || {
    bookingUpdates: true,
    sessionReminders: true,
    offersAndDeals: true
  };

  const bookingUpdates = prefs.bookingUpdates !== false;
  const sessionReminders = prefs.sessionReminders !== false;
  const offersAndDeals = prefs.offersAndDeals !== false;

  switch (notificationType) {
    case 'booking':
      return bookingUpdates;
    case 'reminder':
    case 'event':
      return sessionReminders;
    case 'promotion':
    case 'reward':
    case 'announcement':
    case 'offer':
    case 'alert':
    case 'general':
    default:
      return offersAndDeals;
  }
};

const getPreferenceTag = (notificationType) => {
  switch (notificationType) {
    case 'booking':
      return 'bookingUpdates';
    case 'reminder':
    case 'event':
      return 'sessionReminders';
    default:
      return 'offersAndDeals';
  }
};

// Helper to push to OneSignal if credentials exist in env
const sendOneSignalPush = async (notification) => {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.log('OneSignal credentials missing. Skipping push notification broadcast.');
    return false;
  }

  // 1. If targeted to a single user, check their MongoDB preferences first
  if (notification.user) {
    const user = await User.findById(notification.user);
    if (user && !shouldSendNotification(user, notification.type)) {
      console.log(`Skipping OneSignal push for user ${user._id} due to notification preferences.`);
      return false;
    }
  }

  // 2. Prepare request data payload
  const payloadData = {
    app_id: appId,
    headings: { en: notification.title },
    contents: { en: notification.description || notification.message || '' },
    data: {
      type: notification.type,
      redirectUrl: notification.redirectUrl,
      notificationId: notification._id
    },
    big_picture: notification.bannerImage || undefined
  };

  // 3. Set targeting rules based on preferences
  if (!notification.user) {
    const tagKey = getPreferenceTag(notification.type);
    // Target users who have not set this preference to false (matches both true and unset tags)
    payloadData.filters = [
      { field: 'tag', key: tagKey, relation: '!=', value: 'false' }
    ];

    if (notification.targetAudience === 'premium') {
      payloadData.filters.push({ operator: 'AND' });
      payloadData.filters.push({ field: 'tag', key: 'isPremium', relation: '=', value: 'true' });
    } else if (notification.targetAudience === 'new') {
      payloadData.filters.push({ operator: 'AND' });
      payloadData.filters.push({ field: 'tag', key: 'isNew', relation: '=', value: 'true' });
    }
  } else {
    // Target specific user ID
    payloadData.include_external_user_ids = [notification.user.toString()];
  }

  const data = JSON.stringify(payloadData);

  const options = {
    hostname: 'onesignal.com',
    port: 443,
    path: '/api/v1/notifications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Basic ${apiKey}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        console.log('OneSignal response:', responseBody);
        resolve(true);
      });
    });

    req.on('error', (e) => {
      console.error('OneSignal request error:', e);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

// @desc    Get logged in user's notifications and dynamically sync eligible ones
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    // 1. Fetch all active general/campaign notifications
    const activeNotifications = await Notification.find({
      user: null,
      isActive: true,
      scheduledAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    });

    // 2. Fetch specific user-targeted notifications
    const specificNotifications = await Notification.find({
      user: userId,
      isActive: true,
      scheduledAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    });

    const allCandidateNotifications = [...activeNotifications, ...specificNotifications];

    // 3. Filter candidates based on targetAudience eligibility and user preferences
    for (const notification of allCandidateNotifications) {
      let isEligible = false;

      if (notification.user && notification.user.toString() === userId.toString()) {
        isEligible = true;
      } else {
        const audience = notification.targetAudience;

        if (audience === 'all') {
          isEligible = true;
        } else if (audience === 'premium' && req.user.isPremium) {
          isEligible = true;
        } else if (audience === 'new') {
          // User created in the last 7 days
          const diffTime = Math.abs(now - req.user.createdAt);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) isEligible = true;
        } else if (audience === 'pending_booking') {
          const hasPending = await Booking.findOne({ user: userId, status: 'pending' });
          if (hasPending) isEligible = true;
        } else if (audience === 'completed_booking') {
          const hasCompleted = await Booking.findOne({ user: userId, status: 'completed' });
          if (hasCompleted) isEligible = true;
        }
      }

      // 4. Synchronize UserNotification if eligible and matches user preference toggles
      if (isEligible) {
        if (!shouldSendNotification(req.user, notification.type)) {
          isEligible = false;
        }

        if (isEligible) {
          const exists = await UserNotification.findOne({ user: userId, notification: notification._id });
          if (!exists) {
            await UserNotification.create({
              user: userId,
              notification: notification._id,
              status: 'unread'
            });

            // Increment delivery metrics
            notification.sentCount = (notification.sentCount || 0) + 1;
            notification.deliveredCount = (notification.deliveredCount || 0) + 1;
            await notification.save();
          }
        }
      }
    }

    // 5. Query all UserNotifications for this user
    const userNotifications = await UserNotification.find({ user: userId })
      .populate({
        path: 'notification',
        match: { isActive: true } // Only return notifications that are still active
      })
      .sort({ createdAt: -1 });

    // Filter out populated null entries (in case of inactive/deleted notifications)
    const validNotifications = userNotifications.filter(un => un.notification !== null);

    res.json(validNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification status (read, clicked, dismissed)
// @route   PUT /api/notifications/:id/status
// @access  Private
exports.updateNotificationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['read', 'clicked', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const userNotification = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('notification');

    if (!userNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const oldStatus = userNotification.status;
    userNotification.status = status;

    const now = new Date();
    if (status === 'read') {
      userNotification.readAt = now;
    } else if (status === 'clicked') {
      userNotification.clickedAt = now;
    } else if (status === 'dismissed') {
      userNotification.dismissedAt = now;
    }

    await userNotification.save();

    // Increment analytics counters on original notification
    const notification = userNotification.notification;
    if (notification) {
      if (status === 'read' && oldStatus === 'unread') {
        notification.openedCount = (notification.openedCount || 0) + 1;
      } else if (status === 'clicked') {
        if (oldStatus === 'unread') {
          notification.openedCount = (notification.openedCount || 0) + 1;
        }
        notification.clickedCount = (notification.clickedCount || 0) + 1;
      }
      await notification.save();
    }

    res.json(userNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Create notification campaign
// @route   POST /api/notifications/admin
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      description,
      bannerImage,
      type,
      priority,
      redirectUrl,
      targetAudience,
      ctaText,
      expiresAt,
      scheduledAt
    } = req.body;

    const notification = await Notification.create({
      title,
      description,
      message: description,
      bannerImage,
      type,
      priority,
      redirectUrl,
      targetAudience,
      ctaText,
      expiresAt: expiresAt || null,
      scheduledAt: scheduledAt || Date.now(),
      isActive: true
    });

    // Send push notification broadcast in background (async)
    sendOneSignalPush(notification).then((pushed) => {
      if (pushed) {
        console.log(`Push notification sent successfully for: ${title}`);
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get all notification campaigns
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.adminGetNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: null })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Toggle notification active status
// @route   PUT /api/notifications/admin/:id/status
// @access  Private/Admin
exports.adminToggleNotificationStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isActive = !notification.isActive;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Delete notification campaign
// @route   DELETE /api/notifications/admin/:id
// @access  Private/Admin
exports.adminDeleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();
    // Delete status records of this notification for all users
    await UserNotification.deleteMany({ notification: req.params.id });

    res.json({ message: 'Notification removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get aggregate notifications analytics
// @route   GET /api/notifications/admin/analytics
// @access  Private/Admin
exports.adminGetAnalytics = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: null });
    
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalFailed = 0;

    notifications.forEach(n => {
      totalSent += (n.sentCount || 0);
      totalDelivered += (n.deliveredCount || 0);
      totalOpened += (n.openedCount || 0);
      totalClicked += (n.clickedCount || 0);
      totalFailed += (n.failedCount || 0);
    });

    res.json({
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalFailed,
      campaignsCount: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
