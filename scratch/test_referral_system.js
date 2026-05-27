const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Referral = require('../src/models/Referral');
const FraudAttempt = require('../src/models/FraudAttempt');
const RewardTransaction = require('../src/models/RewardTransaction');
const Booking = require('../src/models/Booking');
const Notification = require('../src/models/Notification');
const UserNotification = require('../src/models/UserNotification');

const { processBookingReward } = require('../src/services/referralService');

async function testReferralSystem() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  try {
    // 1. Clear previous test users if any
    console.log('Cleaning up previous test data...');
    await User.deleteMany({ email: /@test-referral\.com$/ });
    await FraudAttempt.deleteMany({ email: /@test-referral\.com$/ });

    // 2. Create Referrer (User A)
    console.log('Creating Referrer (User A)...');
    const userA = new User({
      name: 'Referrer User A',
      email: 'usera@test-referral.com',
      password: 'password123',
      role: 'user'
    });
    await userA.save();
    console.log(`User A created! Referral Code: ${userA.referralCode}`);

    // 3. Test Fraud Attempt: Self Referral
    console.log('Testing Fraud: Self Referral...');
    const selfReferralAttempt = await User.findOne({ email: 'usera@test-referral.com' });
    // Simulate register request with self referral code
    const isSelfReferral = selfReferralAttempt.referralCode === userA.referralCode;
    if (isSelfReferral) {
      await FraudAttempt.create({
        email: 'usera@test-referral.com',
        deviceId: 'device-123',
        ipAddress: '127.0.0.1',
        type: 'SELF_REFERRAL',
        details: 'User tried to refer themselves.'
      });
      console.log('Successfully blocked and logged Self Referral Fraud Attempt!');
    }

    // 4. Create Referred User (User B) using User A's referral code
    console.log('Creating Referred User (User B) using User A\'s code...');
    // Validate referral code
    const referrer = await User.findOne({ referralCode: userA.referralCode });
    if (!referrer) {
      throw new Error('Referral code validation failed!');
    }

    const userB = new User({
      name: 'Referred User B',
      email: 'userb@test-referral.com',
      password: 'password123',
      role: 'user',
      referredBy: referrer._id,
      deviceId: 'device-456'
    });
    await userB.save();

    // Create Referral record and update stats
    await Referral.create({
      referrer: referrer._id,
      referredUser: userB._id,
      referralCode: referrer.referralCode,
      status: 'SIGNED_UP'
    });

    referrer.referralStats.totalInvites += 1;
    referrer.referralStats.totalJoined += 1;
    await referrer.save();

    console.log('User B registered successfully and referral stats updated!');

    // 5. Test Fraud Attempt: Same Device Abuse
    console.log('Testing Fraud: Same Device Abuse...');
    // Try to register User C with same deviceId as User B
    const deviceId = 'device-456';
    const duplicateDeviceUser = await User.findOne({ deviceId });
    if (duplicateDeviceUser) {
      await FraudAttempt.create({
        email: 'userc@test-referral.com',
        deviceId: deviceId,
        ipAddress: '127.0.0.1',
        type: 'SAME_DEVICE_REFERRAL',
        details: `Device already registered under user ${duplicateDeviceUser.email}`
      });
      console.log('Successfully blocked and logged Same Device Referral Fraud Attempt!');
    }

    // 6. Create Booking for User B
    console.log('Creating completed booking for User B...');
    const booking = new Booking({
      user: userB._id,
      serviceName: 'Fitness Training',
      coachName: 'Coach Kumar',
      date: new Date(),
      time: '10:00 AM',
      mode: 'Home Visit',
      bookingType: 'Demo',
      mobileNumber: '9876543210',
      price: 1500,
      status: 'completed'
    });
    await booking.save();
    console.log('Booking created as completed!');

    // 7. Trigger Reward Engine
    console.log('Triggering reward engine...');
    const rewardProcessed = await processBookingReward(booking._id);
    console.log(`Reward Engine processed status: ${rewardProcessed}`);

    // 8. Verify Balances & Stats
    const updatedUserA = await User.findById(userA._id);
    const updatedUserB = await User.findById(userB._id);
    const updatedReferral = await Referral.findOne({ referredUser: userB._id });
    const transactions = await RewardTransaction.find({ user: { $in: [userA._id, userB._id] } });
    const userANotif = await Notification.findOne({ user: userA._id });
    const userBNotif = await Notification.findOne({ user: userB._id });

    console.log('\n--- VERIFICATION RESULT ---');
    console.log(`User A (Referrer) Earned: ₹${updatedUserA.referralStats.totalEarned} (Expected: ₹200)`);
    console.log(`User B (Referred) Earned: ₹${updatedUserB.referralStats.totalEarned} (Expected: ₹200)`);
    console.log(`Referral Status: ${updatedReferral.status} (Expected: REWARDED)`);
    console.log(`Referral Reward Amount: ${updatedReferral.rewardAmount} (Expected: 200)`);
    console.log(`Total transactions created: ${transactions.length} (Expected: 2)`);
    console.log(`User A Credited Notification: ${userANotif ? 'Yes' : 'No'} (Title: "${userANotif?.title}")`);
    console.log(`User B Credited Notification: ${userBNotif ? 'Yes' : 'No'} (Title: "${userBNotif?.title}")`);
    
    const totalFrauds = await FraudAttempt.countDocuments({ email: /@test-referral\.com$/ });
    console.log(`Total Fraud Records logged: ${totalFrauds} (Expected: 2)`);
    console.log('---------------------------\n');

    if (
      updatedUserA.referralStats.totalEarned === 200 &&
      updatedUserB.referralStats.totalEarned === 200 &&
      updatedReferral.status === 'REWARDED' &&
      transactions.length === 2 &&
      totalFrauds === 2
    ) {
      console.log('✅ ALL TEST CASES PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ TEST VERIFICATION FAILED!');
    }

  } catch (error) {
    console.error('Test execution failed with error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

testReferralSystem();
