const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

async function testAdmin() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERROR]', msg.text());
  });
  page.on('pageerror', err => {
    console.log('[BROWSER UNCAUGHT EXCEPTION]', err.message);
  });

  console.log('Navigating to login as Admin...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/admin', { timeout: 10000 });
  console.log('Landed on /admin');

  // Reload to fetch authenticated data
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const totalIntake = await page.locator('div:has-text("Total Intake Today") >> .text-3xl').first().innerText();
  console.log('Admin Total Intake Today:', totalIntake);

  await page.screenshot({ path: path.resolve(__dirname, '../screenshots/04_admin_dashboard.png'), fullPage: true });
  console.log('Saved 04_admin_dashboard.png');

  await browser.close();
}

testAdmin().catch(console.error);
