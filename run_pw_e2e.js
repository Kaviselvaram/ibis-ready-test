import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console error: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`Page error: ${err.message}`));
  page.on('requestfailed', req => errors.push(`Request failed: ${req.url()} - ${req.failure()?.errorText}`));
  
  const email = `test_e2e_${Date.now()}@example.com`;
  
  console.log("Navigating to /signup");
  await page.goto('http://localhost:3004/signup');
  await page.waitForTimeout(1000);
  
  console.log("Typing signup credentials for", email);
  await page.fill('input[placeholder="Your name"]', 'E2E User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password123!');
  
  console.log("Clicking signup submit...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log("Current URL after signup:", page.url());
  
  // It should have routed to /checkout
  // Let's click Back to route to /login or something, or just go directly
  console.log("Navigating to /login directly");
  await page.goto('http://localhost:3004/login');
  await page.waitForTimeout(1000);
  
  console.log("Typing login credentials...");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password123!');
  
  console.log("Clicking login submit...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log("Current URL after login:", page.url());
  
  console.log("Checking for errors...");
  console.log("Errors:", errors);
  
  await browser.close();
})();
