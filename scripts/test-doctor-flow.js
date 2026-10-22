const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

async function testDoctor() {
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

  console.log('Navigating to login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="text"]', 'doctor.wilson');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/doctor', { timeout: 10000 });
  console.log('Landed on /doctor');

  // Let's reload to trigger refreshAllData with token
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const deptBadge = await page.locator('h1 + span').first().innerText();
  console.log('Doctor department badge:', deptBadge);

  await page.screenshot({ path: path.resolve(__dirname, '../screenshots/03_doctor_dashboard.png'), fullPage: true });
  console.log('Saved 03_doctor_dashboard.png');

  await browser.close();
}

testDoctor().catch(console.error);
