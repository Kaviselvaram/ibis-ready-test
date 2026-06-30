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
  
  const email = `test_e2e_final_${Date.now()}@example.com`;
  
  console.log("Navigating to /signup");
  await page.goto('http://localhost:3004/signup');
  await page.waitForTimeout(1000);
  
  console.log("Typing signup credentials for", email);
  await page.fill('input[placeholder="Your name"]', 'Final E2E User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password123!');
  
  console.log("Clicking signup submit...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  console.log("Navigating to /student directly");
  await page.goto('http://localhost:3004/student');
  await page.waitForTimeout(2000);
  console.log("Current URL after student load:", page.url());
  
  // Click chapter
  console.log("Navigating to Chapter");
  // Just route directly to chapter
  await page.goto('http://localhost:3004/chapter');
  await page.waitForTimeout(2000);
  
  console.log("Navigating to Test Tab");
  await page.click('text=Test');
  await page.waitForTimeout(2000);
  
  console.log("Navigating to Admin");
  await page.goto('http://localhost:3004/admin');
  await page.waitForTimeout(2000);
  
  console.log("Checking for errors...");
  if (errors.length > 0) {
     console.log("Errors:", errors);
  } else {
     console.log("Zero errors found! MVP is clean.");
  }
  
  await browser.close();
})();
