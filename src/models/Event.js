const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: String,
    required: true,
    default: 'Fitness'
  },
  websiteUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Dynamic virtual field to calculate if completed based on current time
eventSchema.virtual('isCompleted').get(function() {
  return new Date() > this.endDate;
});

// Map _id to id for client convenience
eventSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
