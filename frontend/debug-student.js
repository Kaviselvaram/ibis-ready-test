async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teststudent@ibis.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data ? loginData.data.access_token : loginData.access_token;
    
    const qRes = await fetch('http://localhost:4000/api/question', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const qData = await qRes.json();
    console.log("Questions array length:", qData.data ? qData.data.length : qData);
    
    if (qData.data && qData.data.length > 0) {
      console.log("First question:", qData.data[0].chapter, "::", qData.data[0].topic);
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
