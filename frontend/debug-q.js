async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testadmin@ibis.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    
    const qRes = await fetch('http://localhost:4000/api/question', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const qData = await qRes.json();
    console.log("Questions response:", JSON.stringify(qData, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
