const secretKey = 'MRCOACH_EVENT_SYNC_2026_SECRET';

const payload = {
  user_name: "John Doe",
  user_email: "johndoe@example.com",
  verified_mobile_number: "+919876543210",
  event_id: "EVT001",
  event_title: "MrCoach Annual Fitness Workshop 2026",
  booking_id: "ORD12345",
  website_order_id: "ORD12345",
  payment_gateway_order_id: "order_OkJ23Lh9Asdf",
  payment_id: "pay_OkJ45Pq8Rst",
  payment_status: "PAID",
  amount_paid: 1500.00,
  currency: "INR",
  ticket_quantity: 2,
  booking_date_time: "2026-05-27T05:24:26.000Z",
  event_date: "2026-06-15",
  booking_source: "Website"
};

async function runLiveTest() {
  console.log("Sending simulated website event booking sync webhook to http://localhost:5000/api/events/sync-booking...");
  
  try {
    const response = await fetch("http://localhost:5000/api/events/sync-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
        "X-API-KEY": secretKey
      },
      body: JSON.stringify(payload)
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Payload:\n", JSON.stringify(data, null, 2));

    // Also attempt a duplicate test
    console.log("\nSending duplicate request to test duplicate protection...");
    const dupResponse = await fetch("http://localhost:5000/api/events/sync-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
        "X-API-KEY": secretKey
      },
      body: JSON.stringify(payload)
    });
    console.log("Duplicate Response Status:", dupResponse.status);
    const dupData = await dupResponse.json();
    console.log("Duplicate Response Payload:\n", JSON.stringify(dupData, null, 2));

  } catch (error) {
    console.error("Connection failed:", error);
  }
}

runLiveTest();
