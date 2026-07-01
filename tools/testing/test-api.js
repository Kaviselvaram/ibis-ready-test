(async () => {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststudent@ibis.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.access_token;
  const chRes = await fetch('http://localhost:4000/api/course/chapters', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await chRes.json();
  console.log(JSON.stringify(json, null, 2).substring(0, 500));
})();
