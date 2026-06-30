async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teststudent@ibis.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data ? loginData.data.access_token : loginData.access_token;
    console.log("Logged in:", !!token);

    const logoutRes = await fetch('http://localhost:4000/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Logout response:", await logoutRes.json());
    
    // Test if revoked token works
    const qRes = await fetch('http://localhost:4000/api/question', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Fetch with revoked token:", await qRes.json());
  } catch(e) { console.error(e.message); }
}
test();
