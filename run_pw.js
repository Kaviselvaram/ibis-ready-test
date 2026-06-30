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
  
  console.log("Navigating to /login");
  await page.goto('http://localhost:3004/login');
  await page.waitForTimeout(1000);
  
  console.log("Typing credentials...");
  await page.fill('input[type="email"]', 'test_user_mvp@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  
  // Try to click the login button
  console.log("Clicking submit...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log("Current URL after login:", page.url());
  
  console.log("Errors:", errors);
  await browser.close();
})();
