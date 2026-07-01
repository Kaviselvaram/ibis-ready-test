const fetch = require('node-fetch');

(async () => {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent@ibis.com', password: 'password123' })
  });
  
  if (!loginRes.ok) {
    console.log("Login failed", await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.data.access_token;
  console.log("Got token: ", token.substring(0, 15) + '...');
  
  const chRes = await fetch('http://localhost:4000/api/course/chapters', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!chRes.ok) {
    console.log("Chapters failed", chRes.status, await chRes.text());
  } else {
    console.log("Chapters success!");
  }
})();
