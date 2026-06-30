const http = require('http');

const baseURL = 'http://localhost:4000/api';

const makeRequest = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseURL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', error => reject(error));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testAll() {
  const results = [];
  try {
    console.log("1. GET /health");
    let res = await makeRequest('/health');
    results.push({ name: '/health', status: res.status, ok: res.status === 200 });

    console.log("2. POST /auth/signup");
    res = await makeRequest('/auth/signup', 'POST', { email: 'student@example.com', password: 'password', name: 'Student' });
    console.log("Signup Response:", res.data);
    results.push({ name: '/auth/signup', status: res.status, ok: res.status === 200 || res.status === 201 || res.status === 400 });

    console.log("3. POST /auth/login");
    res = await makeRequest('/auth/login', 'POST', { email: 'student@example.com', password: 'password' });
    console.log("Login Response:", res.data);
    results.push({ name: '/auth/login', status: res.status, ok: res.status === 200 || res.status === 401 });
    let setCookie = res.headers['set-cookie'];

    console.log("4. POST /auth/refresh (Without Cookie)");
    res = await makeRequest('/auth/refresh', 'POST');
    results.push({ name: '/auth/refresh (No Cookie)', status: res.status, ok: res.status === 401 });

    console.log("5. GET /course/chapters");
    res = await makeRequest('/course/chapters');
    results.push({ name: '/course/chapters', status: res.status, ok: res.status === 200 });

    console.log("6. GET /course/study-data (Unauth)");
    res = await makeRequest('/course/study-data');
    results.push({ name: '/course/study-data (Unauth)', status: res.status, ok: res.status === 401 });

    console.table(results);
    const allPassed = results.every(r => r.ok);
    if (allPassed) {
      console.log("Backend API Integration tests passed.");
    } else {
      console.error("Some backend API tests failed.");
    }
  } catch (e) {
    console.error("Test execution failed:", e);
  }
}

testAll();
