import jwt from 'jsonwebtoken';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = 'super_secret_enterprise_jwt_key_2026_!@';

function getAdminToken() {
  const payload = {
    sub: 'admin-1234',
    role: 'admin',
    plan: 'premium',
    jti: 'test-jti'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
}

async function testEndpoint(name, method, endpoint, body = null) {
  const token = getAdminToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const json = await res.json();
    
    if (res.status >= 500) {
      console.error(`❌ [${name}] FAILED (Status ${res.status}):`, json);
      return false;
    }
    
    console.log(`✅ [${name}] SUCCESS (Status ${res.status})`);
    return true;
  } catch (err) {
    console.error(`❌ [${name}] NETWORK ERROR:`, err.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting Phase 4.5 Integration Tests...\n");
  
  const results = [];
  results.push(await testEndpoint('Auth Login (Invalid)', 'POST', '/auth/login', { email: 'bad@email.com', password: '123' }));
  results.push(await testEndpoint('Fetch Students', 'GET', '/student'));
  results.push(await testEndpoint('Fetch Batches', 'GET', '/batch'));
  results.push(await testEndpoint('Fetch Courses', 'GET', '/course/chapters'));
  results.push(await testEndpoint('Fetch Questions', 'GET', '/question'));
  
  const allPassed = results.every(r => r === true);
  if (allPassed) {
    console.log("\n🎉 All endpoints successfully integrated and returned 2xx/4xx without crashing.");
    process.exit(0);
  } else {
    console.log("\n⚠️ Some endpoints failed with 500 Runtime Errors.");
    process.exit(1);
  }
}

runTests();
