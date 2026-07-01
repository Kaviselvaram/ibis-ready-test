const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('404')) {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });
  page.on('response', async response => {
    if (response.status() >= 400 && response.status() !== 401) {
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
      try {
        const text = await response.text();
        errors.push(`Body: ${text}`);
      } catch(e) {}
    }
  });

  console.log("Navigating to /login...");
  await page.goto('http://localhost:3002/login');
  await page.waitForSelector('input[type="email"]');
  
  console.log("Filling admin login credentials...");
  await page.fill('input[type="email"]', 'testadmin@ibis.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  
  console.log("Navigating explicitly to /admin...");
  await page.goto('http://localhost:3002/admin');
  
  console.log("Waiting for Admin Portal...");
  try {
    await page.waitForSelector('.admin-shell', { timeout: 10000 });
    console.log("Successfully reached Admin Portal.");
  } catch(e) {
    console.log("Failed to reach /admin. Current URL: " + page.url());
  }

  // Step 2: Navigate to Batches (or equivalent control page)
  console.log("Clicking Full control menu item...");
  const batchesLink = page.locator('button:has-text("Full control")').first();
  try {
    await batchesLink.waitFor({ state: 'visible', timeout: 5000 });
    await batchesLink.click();
    await page.waitForTimeout(2000);
    console.log("Navigated to: " + page.url());
  } catch(e) {
    console.log("Could not find/click Full control.");
  }

  // Step 4: Logout
  console.log("Logging out...");
  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Log out') || b.innerText.includes('Logout'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);
    console.log("Logged out.");
  } catch(e) {
    console.log("Logout failed.");
  }

  console.log("Errors caught during admin journey test:");
  console.log(errors);

  await browser.close();
})();
