const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource: the server responded with a status of 404')) {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });

  console.log("Navigating to Landing Page...");
  await page.goto('http://localhost:3002/');
  await page.waitForLoadState('networkidle');
  
  console.log("Clicking 'Free trial' button...");
  await page.click('text="Free trial"');
  await page.waitForTimeout(2000); 
  
  let currentUrl = page.url();
  console.log(`URL after clicking Free trial: ${currentUrl}`);
  
  console.log("Navigating directly to /signup...");
  await page.goto('http://localhost:3002/signup');
  await page.waitForLoadState('networkidle');
  console.log("Signup page loaded.");

  console.log("Navigating directly to /checkout...");
  await page.goto('http://localhost:3002/checkout');
  await page.waitForLoadState('networkidle');
  console.log("Checkout page loaded.");

  console.log("Errors caught during test:");
  console.log(errors);

  await browser.close();
})();
