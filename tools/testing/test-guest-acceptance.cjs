const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', error => errors.push(`PageError: ${error.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401') && !msg.text().includes('429')) {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });

  try {
    console.log("1. Testing Landing Page...");
    await page.goto('http://localhost:3002/');
    await page.waitForSelector('.portal-award-badge');

    console.log("2. Testing Why Ibis...");
    await page.goto('http://localhost:3002/why-ibis');
    await page.waitForSelector('.why-ibis-screen');

    console.log("3. Testing Checkout...");
    await page.goto('http://localhost:3002/checkout');
    await page.waitForSelector('.checkout-flow');

    console.log("4. Testing Legal...");
    await page.goto('http://localhost:3002/legal');
    await page.waitForSelector('.legal-screen');

    console.log("5. Testing Signup (Empty validation)...");
    await page.goto('http://localhost:3002/signup');
    await page.waitForSelector('.signup-screen');
    // Click submit without filling form
    await page.evaluate(() => {
      document.querySelector('button[type="submit"]').click();
    });
    // Assuming native HTML5 validation or state validation happens, we just ensure it doesn't crash.
    await page.waitForTimeout(500);

    console.log("6. Testing Login (Invalid credentials)...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const loginTab = tabs.find(t => t.textContent === 'Login');
      if (loginTab) loginTab.click();
    });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'badpassword');
    await page.evaluate(() => {
      document.querySelector('button[type="submit"]').click();
    });
    // Wait for the UI to show an error message
    await page.waitForTimeout(1500);

    console.log("Guest & Auth Acceptance crawl completed successfully.");
    if (errors.length > 0) {
      console.error("Errors caught during crawl:", errors);
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
