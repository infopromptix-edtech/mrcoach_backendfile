const axios = require('axios');

const testApi = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/slots');
    console.log('--- API response slots ---');
    response.data.slice(0, 10).forEach(s => {
      console.log(`date: ${s.date}, time: ${s.time}`);
    });
  } catch (err) {
    console.error('Error fetching API:', err.message);
  }
};

testApi();
