async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testadmin@ibis.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    
    const qRes = await fetch('http://localhost:4000/api/question', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await qRes.json();
    console.log("Data keys:", Object.keys(data));
    if (data.data) {
        console.log("Data.data length:", data.data.length);
        if (data.data.length > 0) {
            console.log("First question:", data.data[0]);
        }
    } else {
        console.log("Data itself:", data);
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
