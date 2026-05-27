const mongoose = require('mongoose');

const serviceMediaSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  aspectRatio: {
    type: String,
    default: '1:1'
  }
}, {
  timestamps: true
});

const ServiceMedia = mongoose.model('ServiceMedia', serviceMediaSchema);
module.exports = ServiceMedia;
