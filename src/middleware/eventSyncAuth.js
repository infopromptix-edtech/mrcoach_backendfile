const EventSyncLog = require('../models/EventSyncLog');

const eventSyncAuth = async (req, res, next) => {
  const secretKey = process.env.EVENT_SYNC_SECRET_KEY || 'MRCOACH_EVENT_SYNC_2026_SECRET';
  
  // Try X-API-KEY header first
  let token = req.headers['x-api-key'];
  
  // Or Authorization Bearer token
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token || token !== secretKey) {
    // Log unauthorized attempt
    await EventSyncLog.create({
      requestPayload: { 
        headers: {
          'x-api-key': req.headers['x-api-key'] ? 'PRESENT' : 'MISSING',
          authorization: req.headers.authorization ? 'PRESENT' : 'MISSING'
        },
        body: req.body 
      },
      status: 'unauthorized',
      errorMessage: 'Invalid or missing EVENT_SYNC_SECRET_KEY',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    });
    
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing API sync secret key'
    });
  }
  
  next();
};

module.exports = eventSyncAuth;
