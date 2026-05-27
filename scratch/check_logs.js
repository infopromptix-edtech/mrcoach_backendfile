const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const EventBooking = require('../src/models/EventBooking');
const EventSyncLog = require('../src/models/EventSyncLog');

async function check() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  console.log("\n--- LATEST 5 SYNC ATTEMPTS (EventSyncLog) ---");
  const logs = await EventSyncLog.find().sort({ createdAt: -1 }).limit(5);
  if (logs.length === 0) {
    console.log("No sync logs found in the database.");
  } else {
    logs.forEach((log, index) => {
      console.log(`\nLog #${index + 1}:`);
      console.log(`Time: ${log.createdAt}`);
      console.log(`Status: ${log.status}`);
      console.log(`IP: ${log.ipAddress}`);
      console.log(`User-Agent: ${log.userAgent}`);
      console.log(`Error Message: ${log.errorMessage || 'None'}`);
      console.log(`Payload Keys:`, Object.keys(log.requestPayload || {}));
      console.log(`Payload payment_status:`, log.requestPayload?.payment_status);
      console.log(`Payload payment_id:`, log.requestPayload?.payment_id);
    });
  }

  console.log("\n--- LATEST 5 SUCCESSFUL BOOKINGS (EventBooking) ---");
  const bookings = await EventBooking.find().sort({ syncedAt: -1 }).limit(5);
  if (bookings.length === 0) {
    console.log("No bookings found in the database.");
  } else {
    bookings.forEach((b, index) => {
      console.log(`\nBooking #${index + 1}:`);
      console.log(`Synced At: ${b.syncedAt}`);
      console.log(`User: ${b.user_name} (${b.verified_mobile_number})`);
      console.log(`Event: ${b.event_title}`);
      console.log(`Amount: ${b.amount_paid} ${b.currency}`);
      console.log(`Payment Status: ${b.payment_status}`);
      console.log(`Payment ID: ${b.payment_id}`);
    });
  }

  await mongoose.disconnect();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
