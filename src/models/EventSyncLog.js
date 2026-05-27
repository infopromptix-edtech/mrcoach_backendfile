const mongoose = require('mongoose');

const eventSyncLogSchema = new mongoose.Schema({
  requestPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'unauthorized', 'duplicate', 'invalid_payload'],
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventSyncLog', eventSyncLogSchema);
