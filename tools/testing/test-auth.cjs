const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}\nStack: ${error.stack}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });

  console.log("Navigating to /signup...");
  await page.goto('http://localhost:3002/signup');
  
  // Wait for the email input to be visible instead of network idle
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;
  
  console.log("Filling signup credentials for " + testEmail + "...");
  await page.fill('input[type="text"]', 'E2E Test User');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', 'testpassword123');
  
  console.log("Clicking submit to signup...");
  await page.click('button[type="submit"]');
  
  // After signup, the app should redirect to /checkout (or show success)
  await page.waitForTimeout(3000); 
  
  let currentUrl = page.url();
  console.log(`URL after signup: ${currentUrl}`);
  
  // Now we need to log in to ensure auth worked and session is active
  console.log("Navigating to /login...");
  await page.goto('http://localhost:3002/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  console.log("Filling login credentials...");
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', 'testpassword123');
  
  console.log("Clicking submit to login...");
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000); 
  
  currentUrl = page.url();
  console.log(`URL after login: ${currentUrl}`);
  
  if (currentUrl.includes('/student')) {
    console.log("Successfully logged in and reached /student.");
  } else {
    console.log("Did not reach /student. Stayed at: " + currentUrl);
  }
  
  console.log("Waiting to ensure no delayed crashes...");
  await page.waitForTimeout(2000);

  console.log("Errors caught during auth test:");
  console.log(errors);

  await browser.close();
})();
