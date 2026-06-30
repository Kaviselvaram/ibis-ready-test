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
    console.log("1. Admin Login...");
    await page.goto('http://localhost:3002/login');
    await page.waitForSelector('.signup-screen');
    await page.waitForTimeout(2000); // wait for init
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const loginTab = tabs.find(t => t.textContent === 'Login');
      if (loginTab) loginTab.click();
    });
    await page.fill('input[type="email"]', 'testadmin@ibis.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    console.log("2. Verifying Admin Shell...");
    await page.waitForSelector('.admin-shell');

    console.log("3. Executing CREATE Chapter...");
    // Type in new chapter input
    await page.fill('input[placeholder="New chapter name"]', 'Acceptance Chapter');
    // Click Add Chapter
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add chapter'));
      if (addBtn) addBtn.click();
    });
    // Verify it appeared
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('.admin-row')).some(el => el.textContent.includes('Acceptance Chapter'));
    });

    console.log("4. Executing CREATE Topic...");
    await page.fill('input[placeholder="New topic name"]', 'Acceptance Topic');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add topic'));
      if (addBtn) addBtn.click();
    });
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('.admin-row')).some(el => el.textContent.includes('Acceptance Topic'));
    });

    console.log("5. Executing UPDATE Topic (Notes)...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs.compact button'));
      const notesTab = tabs.find(t => t.textContent === 'Notes');
      if (notesTab) notesTab.click();
    });
    await page.fill('textarea', '\\\\[ E = mc^2 \\\\]');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pubBtn = buttons.find(b => b.textContent.includes('Publish to students'));
      if (pubBtn) pubBtn.click();
    });
    // Ensure latex preview rendered
    await page.waitForSelector('.latex-preview');

    console.log("6. Executing DELETE Topic & Chapter...");
    await page.evaluate(() => {
      // Just click the first delete button we find, which deletes the current active chapter/topic
      const trashBtns = Array.from(document.querySelectorAll('button[aria-label="Delete"]'));
      if (trashBtns.length > 0) trashBtns[0].click();
    });

    console.log("7. Verifying Batch Control Modal...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fullCtrl = buttons.find(b => b.textContent.includes('Full control'));
      if (fullCtrl) fullCtrl.click();
    });
    await page.waitForSelector('.batch-shell'); // It goes to BatchControl which is a batch-shell
    
    console.log("8. Verifying JSON Upload (Mock)...");
    await page.click('.topbar button');
    await page.waitForSelector('.tabs.compact');
    await page.click('button:has-text("Test bank")');
    await page.waitForTimeout(1000); // Give it a second to render
    await page.screenshot({ path: 'admin-qbank-error.png' });
    await page.waitForSelector('.qbank-upload');

    console.log("Admin CRUD Acceptance crawl completed successfully.");
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
