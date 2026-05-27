const Event = require('../models/Event');
const EventBooking = require('../models/EventBooking');
const EventSyncLog = require('../models/EventSyncLog');
const User = require('../models/User');

// Helper to construct filter query based on user options
const buildFilterQuery = (req, isUpcoming) => {
  const query = {};
  const now = new Date();

  // 1. Classification: Upcoming vs Completed based on current datetime vs endDate
  if (isUpcoming) {
    query.endDate = { $gt: now };
  } else {
    query.endDate = { $lte: now };
  }

  // 2. Filter by Date (e.g., YYYY-MM-DD)
  if (req.query.date) {
    const filterDate = new Date(req.query.date);
    const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
    query.startDate = { $gte: startOfDay, $lte: endOfDay };
  }

  // 3. Filter by Month and/or Year
  if (req.query.month || req.query.year) {
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    if (req.query.month) {
      const month = parseInt(req.query.month) - 1; // 0-indexed month
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      query.startDate = { $gte: start, $lte: end };
    } else {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      query.startDate = { $gte: start, $lte: end };
    }
  }

  // 4. Filter by Price Range
  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    query.price = {};
    if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
      query.price.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
      query.price.$lte = parseFloat(req.query.maxPrice);
    }
  }

  // 5. Filter by Event Category / Type
  if (req.query.category && req.query.category !== '') {
    query.category = { $regex: new RegExp(req.query.category, 'i') };
  }

  return query;
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
const getUpcomingEvents = async (req, res) => {
  try {
    const query = buildFilterQuery(req, true);
    const events = await Event.find(query).sort({ startDate: 1 }); // nearest start first
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed events
// @route   GET /api/events/completed
// @access  Public
const getCompletedEvents = async (req, res) => {
  try {
    const query = buildFilterQuery(req, false);
    const events = await Event.find(query).sort({ endDate: -1 }); // most recently completed first
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { title, slug, image, startDate, endDate, location, price, category, websiteUrl } = req.body;

    const event = new Event({
      title,
      slug,
      image,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      price: price ? parseFloat(price) : 0,
      category,
      websiteUrl
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      event.title = req.body.title || event.title;
      event.slug = req.body.slug || event.slug;
      event.image = req.body.image || event.image;
      if (req.body.startDate) event.startDate = new Date(req.body.startDate);
      if (req.body.endDate) event.endDate = new Date(req.body.endDate);
      event.location = req.body.location || event.location;
      if (req.body.price !== undefined) event.price = parseFloat(req.body.price);
      event.category = req.body.category || event.category;
      event.websiteUrl = req.body.websiteUrl || event.websiteUrl;

      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      await Event.deleteOne({ _id: event._id });
      res.json({ message: 'Event removed permanently' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Synchronize event bookings from Website
// @route   POST /api/events/sync-booking
// @access  Private/Sync API Secret
const syncEventBooking = async (req, res) => {
  const payload = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  try {
    // 1. Validate payload fields
    const requiredFields = [
      'user_name',
      'verified_mobile_number',
      'event_id',
      'event_title',
      'payment_id',
      'payment_status',
      'amount_paid',
      'booking_date_time'
    ];

    const missingFields = requiredFields.filter(field => payload[field] === undefined || payload[field] === null || payload[field] === '');
    
    if (missingFields.length > 0) {
      await EventSyncLog.create({
        requestPayload: payload,
        status: 'invalid_payload',
        errorMessage: `Missing required fields: ${missingFields.join(', ')}`,
        ipAddress,
        userAgent
      });
      return res.status(400).json({
        success: false,
        message: `Validation failed: Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // 2. Payment status validation
    const paymentStatus = String(payload.payment_status).toUpperCase();
    if (paymentStatus !== 'PAID') {
      await EventSyncLog.create({
        requestPayload: payload,
        status: 'failed',
        errorMessage: `Payment status is ${paymentStatus}, only PAID bookings are processed`,
        ipAddress,
        userAgent
      });
      return res.status(400).json({
        success: false,
        message: `Validation failed: Only PAID bookings are allowed. Got status: ${paymentStatus}`
      });
    }

    // 3. Duplicate check
    const duplicateQuery = {
      $or: [
        { payment_id: payload.payment_id }
      ]
    };
    if (payload.booking_id) {
      duplicateQuery.$or.push({ booking_id: payload.booking_id });
    }
    if (payload.website_order_id) {
      duplicateQuery.$or.push({ website_order_id: payload.website_order_id });
    }

    const existingBooking = await EventBooking.findOne(duplicateQuery);
    if (existingBooking) {
      await EventSyncLog.create({
        requestPayload: payload,
        status: 'duplicate',
        errorMessage: `Duplicate booking attempt matched query: ${JSON.stringify(duplicateQuery.$or)}`,
        ipAddress,
        userAgent
      });
      return res.status(409).json({
        success: false,
        message: 'Duplicate booking: payment_id, booking_id, or website_order_id already exists.'
      });
    }

    // 4. Auto user mapping
    const email = payload.user_email ? String(payload.user_email).toLowerCase().trim() : '';
    const rawPhone = String(payload.verified_mobile_number).trim();
    
    // Normalize phone number to match with or without +91 prefix
    const phoneVariants = [rawPhone];
    if (rawPhone.startsWith('+91')) {
      phoneVariants.push(rawPhone.replace('+91', ''));
    } else if (rawPhone.length === 10) {
      phoneVariants.push('+91' + rawPhone);
    }

    const userQuery = {
      $or: [
        { phoneNumber: { $in: phoneVariants } }
      ]
    };
    if (email) {
      userQuery.$or.push({ email });
    }

    const mappedUser = await User.findOne(userQuery);
    const userId = mappedUser ? mappedUser._id : null;

    // 5. Create EventBooking
    const eventBooking = await EventBooking.create({
      userId,
      user_name: payload.user_name,
      user_email: payload.user_email || '',
      verified_mobile_number: payload.verified_mobile_number,
      event_id: payload.event_id,
      event_title: payload.event_title,
      booking_id: payload.booking_id || null,
      website_order_id: payload.website_order_id || null,
      payment_gateway_order_id: payload.payment_gateway_order_id || null,
      payment_id: payload.payment_id,
      payment_status: payload.payment_status,
      amount_paid: Number(payload.amount_paid),
      currency: payload.currency || 'INR',
      ticket_quantity: Number(payload.ticket_quantity) || 1,
      booking_date_time: new Date(payload.booking_date_time),
      event_date: payload.event_date ? new Date(payload.event_date) : null,
      booking_source: payload.booking_source || 'website',
      sync_status: 'success',
      metadata: payload.metadata || {},
      syncedAt: new Date()
    });

    // 6. Create success log
    await EventSyncLog.create({
      requestPayload: payload,
      status: 'success',
      errorMessage: null,
      ipAddress,
      userAgent
    });

    return res.status(201).json({
      success: true,
      message: 'Event booking synchronized successfully',
      bookingId: eventBooking._id,
      mappedUser: userId ? 'mapped' : 'guest'
    });

  } catch (error) {
    console.error('Error syncing event booking:', error);
    await EventSyncLog.create({
      requestPayload: payload,
      status: 'failed',
      errorMessage: error.message,
      ipAddress,
      userAgent
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error while syncing event booking'
    });
  }
};

module.exports = {
  getUpcomingEvents,
  getCompletedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  syncEventBooking
};
