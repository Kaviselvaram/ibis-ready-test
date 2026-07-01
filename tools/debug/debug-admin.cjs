const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  await page.goto('http://localhost:3002/login');
  await page.waitForSelector('.signup-screen');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const loginTab = tabs.find(t => t.textContent === 'Login');
    if (loginTab) loginTab.click();
  });
  await page.fill('input[type="email"]', 'testadmin@ibis.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for admin panel
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
