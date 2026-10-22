const { chromium } = require('playwright-core');

async function testLaunch() {
  console.log('Testing Edge launch via playwright-core...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  console.log('Edge launched successfully!');
  const page = await browser.newPage();
  await page.goto('data:text/html,<h1>Edge Launch OK</h1>');
  console.log('Page loaded, title:', await page.title());
  await browser.close();
  console.log('Browser closed cleanly.');
}

testLaunch().catch(err => {
  console.error('Launch failed:', err);
  process.exit(1);
});
