const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });
  page.on('response', async response => {
    if (response.status() === 401) {
      errors.push(`401 Unauthorized: ${response.url()}`);
    }
    if (response.url().includes('course/chapters')) {
      try {
        const json = await response.json();
        console.log("Chapters response data length:", json.data ? json.data.length : (json.length || "unknown"));
      } catch(e) {}
    }
  });

  page.on('request', request => {
    if (request.url().includes('/api/course/chapters')) {
      console.log(`Request to chapters. Headers: `, request.headers()['authorization']);
    }
  });

  console.log("Navigating to /login...");
  await page.goto('http://localhost:3002/login');
  await page.waitForSelector('input[type="email"]');
  
  console.log("Filling login credentials...");
  await page.fill('input[type="email"]', 'teststudent@ibis.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for Student Portal...");
  try {
    await page.waitForSelector('.app-shell', { timeout: 10000 });
    console.log("Successfully reached Student Portal.");
  } catch(e) {
    console.log("Failed to reach /student. Current URL: " + page.url());
  }

  // Step 3: Open a Chapter
  console.log("Looking for Chapter card action button...");
  try {
    await page.waitForSelector('.student-feature-read button', { state: 'visible', timeout: 5000 });
    const btns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.student-feature-read button')).map(b => b.innerText);
    });
    console.log("Found buttons:", btns);
    await page.evaluate(() => {
      document.querySelector('.student-feature-read button').click();
    });
    console.log("Clicked Chapter card. URL:", page.url());
  } catch (e) {
    console.log("Could not find/click chapter card action btn.", e.message);
    await page.screenshot({ path: '/tmp/student-error1.png' });
  }
  
  // Wait for Chapter View to load
  try {
    await page.waitForSelector('.learning-shell', { timeout: 5000 });
    console.log("Learning shell visible. URL:", page.url());
  } catch (e) {
    console.log("Learning shell NOT visible.");
    await page.screenshot({ path: '/tmp/student-error2.png' });
  }


  console.log("Looking for Notes button...");
  const notesBtn = page.locator('button:has-text("Notes")').first();
  try {
    await notesBtn.waitFor({ state: 'visible', timeout: 3000 });
    await notesBtn.click({ force: true, timeout: 5000 });
    console.log("Clicked Notes.");
  } catch (e) {
    console.log("Notes button not clicked.");
    await page.screenshot({ path: '/tmp/student-error3.png' });
  }
  
  console.log("Looking for Generate Test button...");
  const testTabBtn = page.locator('button:has-text("Test")').first();
  try {
    await testTabBtn.waitFor({ state: 'visible', timeout: 3000 });
    await testTabBtn.click({ force: true, timeout: 5000 });
    const genBtn = page.locator('button:has-text("Generate Test"), button:has-text("Start"), button:has-text("Create")').first();
    await genBtn.waitFor({ state: 'visible', timeout: 3000 });
    await genBtn.click({ force: true, timeout: 5000 });
    console.log("Clicked Generate Test.");
  } catch (e) {
    console.log("Start test failed.");
    await page.screenshot({ path: '/tmp/student-error4.png' });
  }

  // Step 6: Logout
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

  console.log("Errors caught during student journey test:");
  console.log(errors);

  await browser.close();
})();
