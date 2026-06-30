import jwt from 'jsonwebtoken';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = 'super_secret_enterprise_jwt_key_2026_!@#';

function getAdminToken() {
  const payload = {
    sub: 'admin-1234',
    role: 'admin',
    plan: 'premium',
    jti: 'test-jti'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
}

async function testEndpoint() {
  const token = getAdminToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const res = await fetch(`${BASE_URL}/student`, { method: 'GET', headers });
  const json = await res.json();
  console.log(res.status, json);
}
testEndpoint();
