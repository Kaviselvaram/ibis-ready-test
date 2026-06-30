const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'testadmin@ibis.com',
      password: 'password123'
    });
    const token = loginRes.data.data.access_token;
    console.log("Token:", token.substring(0, 10) + "...");
    
    const qRes = await axios.get('http://localhost:4000/api/question', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Questions response:", JSON.stringify(qRes.data, null, 2));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
