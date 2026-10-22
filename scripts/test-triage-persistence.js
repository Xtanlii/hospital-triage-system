const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

async function testTriagePersistence() {
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

  console.log('Logging in as Nurse Sarah...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="text"]', 'nurse.sarah');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/nurse', { timeout: 10000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  console.log('Navigating to /nurse/triage/new...');
  await page.goto(`${BASE_URL}/nurse/triage/new`, { waitUntil: 'domcontentloaded' });

  // Select patient
  const select = page.locator('select').first();
  await select.selectOption({ index: 2 }); // pick second patient (e.g. Ford Prefect)

  // Transport
  await page.selectOption('#arrival-transport', 'AMBULANCE');

  // Pain unreportable
  await page.locator('input[type="checkbox"]').first().check();

  // Chief complaint
  await page.fill('#complaint', 'Acute sudden chest tightness and respiratory distress');

  // Prediction
  await page.click('button:has-text("Run Triage Prediction")');
  await page.waitForSelector('text=AI Model Predicted Level', { timeout: 10000 });

  // Submit
  await page.click('button:has-text("Complete Triage & Add to Queue")');
  await page.waitForSelector('text=Triage Assessment Completed', { timeout: 10000 });

  const assignedQueueNum = await page.locator('div.text-3xl.font-black.font-mono').innerText();
  console.log('Assigned Queue Ticket:', assignedQueueNum);

  // Close modal by clicking "Go to Queue"
  await page.click('button:has-text("Go to Queue")');
  await page.waitForURL('**/nurse/queue', { timeout: 10000 });

  // Now reload page so data is re-fetched from PostgreSQL API!
  console.log('Reloading page on /nurse/queue to test persistence from API...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Take screenshot 02_triage_persisted.png
  await page.screenshot({ path: path.resolve(__dirname, '../screenshots/02_triage_persisted.png'), fullPage: true });
  console.log('Saved 02_triage_persisted.png');

  // Check table rows
  const rows = await page.locator('table tbody tr').allInnerTexts();
  console.log('Queue table rows after reload:', rows);

  await browser.close();
}

testTriagePersistence().catch(console.error);
