import fetch from 'node-fetch';
(async () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  console.log("Signup with email:", email);
  
  const res = await fetch('http://localhost:4000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Test User' })
  });
  const data = await res.json();
  console.log("Signup Response:", data);
})();
