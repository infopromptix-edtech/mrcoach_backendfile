const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const EventBooking = require('../src/models/EventBooking');
const EventSyncLog = require('../src/models/EventSyncLog');

const { syncEventBooking } = require('../src/controllers/eventController');

async function runTests() {
  console.log("Connecting to Database: " + process.env.MONGO_URI.split('@')[1] || process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully.");

  // Mock request and response
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  // Setup a test user to test mapping
  console.log("Creating test user for mapping verification...");
  const testPhone = "+919790852590";
  const testEmail = "2kamalesh0809@gmail.com";
  
  let user = await User.findOne({ email: testEmail });
  if (!user) {
    user = await User.create({
      name: "kamalesh",
      email: testEmail,
      phoneNumber: testPhone,
      password: "testpassword",
      role: "user"
    });
  }

  // Clear existing test bookings for clean runs
  await EventBooking.deleteMany({ event_id: 'evt_test_2026' });
  await EventSyncLog.deleteMany({ status: { $in: ['success', 'failed', 'invalid_payload', 'duplicate', 'unauthorized'] } });

  console.log("\n--- TEST 1: Valid sync and User mapping ---");
  const req1 = {
    body: {
      user_name: "kamalesh",
      user_email: testEmail,
      verified_mobile_number: testPhone,
      event_id: "evt_test_2026",
      event_title: "Test Masterclass",
      booking_id: "bk_test_1001",
      website_order_id: "order_test_1001",
      payment_id: "pay_test_1001",
      payment_status: "PAID",
      amount_paid: 500,
      booking_date_time: new Date().toISOString()
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'NodeTestScript' }
  };
  const res1 = mockRes();
  await syncEventBooking(req1, res1);
  console.log("Status Code:", res1.statusCode);
  console.log("Response JSON:", res1.jsonData);
  if (res1.statusCode === 201 && res1.jsonData.mappedUser === 'mapped') {
    console.log("✅ TEST 1 PASSED");
  } else {
    console.log("❌ TEST 1 FAILED");
  }

  console.log("\n--- TEST 2: Duplicate booking rejection ---");
  const res2 = mockRes();
  await syncEventBooking(req1, res2);
  console.log("Status Code:", res2.statusCode);
  console.log("Response JSON:", res2.jsonData);
  if (res2.statusCode === 409) {
    console.log("✅ TEST 2 PASSED");
  } else {
    console.log("❌ TEST 2 FAILED");
  }

  console.log("\n--- TEST 3: Reject non-PAID payment status ---");
  const req3 = {
    body: {
      ...req1.body,
      payment_id: "pay_test_1002",
      booking_id: "bk_test_1002",
      website_order_id: "order_test_1002",
      payment_status: "FAILED"
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'NodeTestScript' }
  };
  const res3 = mockRes();
  await syncEventBooking(req3, res3);
  console.log("Status Code:", res3.statusCode);
  console.log("Response JSON:", res3.jsonData);
  if (res3.statusCode === 400) {
    console.log("✅ TEST 3 PASSED");
  } else {
    console.log("❌ TEST 3 FAILED");
  }

  console.log("\n--- TEST 4: Reject missing fields ---");
  const req4 = {
    body: {
      user_name: "Jane Doe"
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'NodeTestScript' }
  };
  const res4 = mockRes();
  await syncEventBooking(req4, res4);
  console.log("Status Code:", res4.statusCode);
  console.log("Response JSON:", res4.jsonData);
  if (res4.statusCode === 400) {
    console.log("✅ TEST 4 PASSED");
  } else {
    console.log("❌ TEST 4 FAILED");
  }

  // Clean up
  console.log("\nCleaning up test logs and test user...");
  await EventBooking.deleteMany({ event_id: 'evt_test_2026' });
  
  await mongoose.disconnect();
  console.log("Tests finished.");
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
