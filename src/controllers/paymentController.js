const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Amount should be in rupees

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create order' });
    }

    res.status(200).json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay createOrder Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified successfully!
      // (Optional: Update the booking status to 'Paid' in your database here)
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature!" });
    }
  } catch (error) {
    console.error('Razorpay verifyPayment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
