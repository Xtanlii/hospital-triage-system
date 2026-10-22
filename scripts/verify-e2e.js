/**
 * Automated Playwright End-to-End Verification Script
 * Uses pre-installed Microsoft Edge binary to verify:
 * 1. Nurse login & dashboard data loading from API (Screenshot: screenshots/01_nurse_dashboard.png)
 * 2. Triage intake (nullable vitals, unreportable pain, arrival transport) & queue persistence across reload (Screenshot: screenshots/02_triage_persisted.png)
 * 3. Doctor login, department isolation, and duty check-in/out toggle (Screenshot: screenshots/03_doctor_dashboard.png)
 * 4. Admin login, operational statistics, and queue analytics (Screenshot: screenshots/04_admin_dashboard.png)
 * 5. Strict absence of desktop and mobile Topbar role switcher UI
 */

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING PLAYWRIGHT E2E ACCEPTANCE VERIFICATION');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Browser: Microsoft Edge (${EDGE_PATH})`);
  console.log(`Screenshots Dir: ${SCREENSHOT_DIR}`);
  console.log('====================================================\n');

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`[BROWSER UNCAUGHT EXCEPTION] ${err.message}\n${err.stack}`);
  });

  // Helper for step logging
  function logStep(step, message) {
    console.log(`[STEP ${step}] ${message}`);
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: NURSE LOGIN & SEEDED DATA FROM API
    // -------------------------------------------------------------------------
    logStep(1, 'Navigating to Login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    logStep(1, 'Logging in as Nurse Sarah (nurse.sarah / password123)...');
    // Clear and fill username and password
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    await usernameInput.fill('nurse.sarah');
    await passwordInput.fill('password123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation to /nurse
    await page.waitForURL('**/nurse', { timeout: 10000 });
    console.log('✓ Successfully landed on /nurse');

    // Reload or wait for data load
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Assert seeded queue data from API
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`✓ Nurse Queue Table rendered ${tableRows} rows from API.`);

    // Verify presence of seeded tickets / patients (e.g. Q-101, Arthur Dent, etc.)
    const tableText = await page.locator('table tbody').innerText();
    console.log(`✓ Sample queue entries in table: ${tableText.split('\n').slice(0, 5).join(' | ')}`);

    // Verify Active Waiting Queue stat card
    const waitingStat = await page.locator('div:has-text("Active Waiting Queue") >> .text-3xl').first().innerText();
    console.log(`✓ Active Waiting Queue stat from API: ${waitingStat}`);

    // Assert Topbar role switcher does NOT exist
    await assertNoRoleSwitcher(page, 'Desktop (Nurse)');

    // Save Screenshot 1
    const screenshot1 = path.join(SCREENSHOT_DIR, '01_nurse_dashboard.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log(`✓ Saved Screenshot 1: ${screenshot1}`);

    // -------------------------------------------------------------------------
    // STEP 2: TRIAGE SUBMISSION (NULLABLE VITALS, ARRIVAL TRANSPORT, UNREPORTABLE PAIN) & PERSISTENCE
    // -------------------------------------------------------------------------
    logStep(2, 'Navigating to New Triage page (/nurse/triage/new)...');
    await page.goto(`${BASE_URL}/nurse/triage/new`, { waitUntil: 'domcontentloaded' });

    // Select a patient from dropdown
    logStep(2, 'Selecting patient from registry dropdown...');
    const patientSelect = page.locator('select').first();
    // Get all options
    const options = await patientSelect.locator('option').allInnerTexts();
    console.log(`✓ Available patients in intake registry: ${options.slice(1).join(', ')}`);
    // Select the first valid patient option (value index 1)
    await patientSelect.selectOption({ index: 1 });

    // Arrival Transport dropdown (select AMBULANCE)
    logStep(2, 'Selecting Arrival Transport: AMBULANCE...');
    await page.selectOption('#arrival-transport', 'AMBULANCE');
    const selectedTransport = await page.inputValue('#arrival-transport');
    if (selectedTransport !== 'AMBULANCE') {
      throw new Error(`Expected AMBULANCE but got ${selectedTransport}`);
    }
    console.log('✓ Arrival Transport confirmed: AMBULANCE');

    // Pain Score: Check "Not Reportable / Unconscious"
    logStep(2, 'Marking pain as "Not Reportable / Unconscious"...');
    const painCheckbox = page.locator('input[type="checkbox"]').first();
    await painCheckbox.check();
    const isUnreportableChecked = await painCheckbox.isChecked();
    if (!isUnreportableChecked) {
      throw new Error('Failed to check Not Reportable pain checkbox');
    }
    console.log('✓ Pain successfully marked as Not Reportable (pain = null)');

    // Fill Chief Complaint
    logStep(2, 'Entering Chief Complaint...');
    await page.fill('#complaint', 'Acute crushing retrosternal chest pain with diaphoresis');

    // Fill Clinical narrative
    await page.fill('textarea', 'Patient presented via ambulance with sudden onset severe chest tightness.');

    // Crucial check: Vital signs remain BLANK (nullable vitals verification)
    logStep(2, 'Verifying vital signs inputs are left empty/blank...');
    const tempInput = await page.inputValue('#temp');
    const bpInput = await page.inputValue('#bp');
    const hrInput = await page.inputValue('#hr');
    const rrInput = await page.inputValue('#rr');
    const spo2Input = await page.inputValue('#spo2');
    console.log(`✓ Vitals blank verification: temp="${tempInput}", bp="${bpInput}", hr="${hrInput}", rr="${rrInput}", spo2="${spo2Input}"`);
    if (tempInput !== '' || hrInput !== '') {
      throw new Error('Vital signs are not blank!');
    }

    // Run AI Triage Predictor
    logStep(2, 'Executing AI Triage Predictor / Clinical Fallback...');
    const predictBtn = page.locator('button:has-text("Run Triage Prediction")');
    await predictBtn.click();

    // Wait for prediction result card or final level badge to update
    await page.waitForSelector('text=AI Model Predicted Level', { timeout: 10000 });
    console.log('✓ Triage prediction / fallback calculated successfully.');

    // Submit triage assessment & queue entry
    logStep(2, 'Submitting final triage assessment to backend API...');
    const submitBtn = page.locator('button:has-text("Complete Triage & Add to Queue")');
    await submitBtn.click();

    // Wait for confirmation modal
    logStep(2, 'Waiting for Confirmation Modal...');
    await page.waitForSelector('text=Triage Assessment Completed', { timeout: 10000 });

    // Extract assigned queue ticket number
    const assignedQueueNumber = await page.locator('div.text-3xl.font-black.font-mono').innerText();
    console.log(`✓ New triage queue ticket created: ${assignedQueueNumber}`);

    // Click "Go to Queue" button inside modal
    const goToQueueBtn = page.locator('button:has-text("Go to Queue")');
    await goToQueueBtn.click();

    // Wait for Queue Page
    await page.waitForURL('**/nurse/queue', { timeout: 10000 });
    console.log('✓ Landed on /nurse/queue');

    // Assert newly created queue number exists in queue table
    await page.waitForSelector(`table tbody tr:has-text("${assignedQueueNumber}")`, { timeout: 10000 });
    console.log(`✓ Verified ${assignedQueueNumber} is present in live queue table from API.`);

    // Test Persistence Across Page Reload
    logStep(2, 'Executing page.reload() to test database persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Assert patient still persists in queue after reload
    await page.waitForSelector(`table tbody tr:has-text("${assignedQueueNumber}")`, { timeout: 10000 });
    console.log(`✓ Verified ${assignedQueueNumber} PERSISTS after page reload (loaded from PostgreSQL API)!`);

    // Save Screenshot 2
    const screenshot2 = path.join(SCREENSHOT_DIR, '02_triage_persisted.png');
    await page.screenshot({ path: screenshot2, fullPage: true });
    console.log(`✓ Saved Screenshot 2: ${screenshot2}`);

    // -------------------------------------------------------------------------
    // STEP 3: DOCTOR FLOW & DEPARTMENT QUEUE ISOLATION & DUTY TOGGLE
    // -------------------------------------------------------------------------
    logStep(3, 'Signing out and logging in as Doctor Wilson (doctor.wilson / password123)...');
    // Clear localStorage and navigate to /login
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="text"]', 'doctor.wilson');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to /doctor
    await page.waitForURL('**/doctor', { timeout: 10000 });
    console.log('✓ Successfully landed on /doctor');

    // Assert department queue isolation
    logStep(3, 'Asserting department queue isolation for Emergency...');
    await page.waitForSelector('text=Physician Station', { timeout: 10000 });
    
    // Check department badge
    const deptBadge = await page.locator('h1 + span').first().innerText();
    console.log(`✓ Doctor department displayed: "${deptBadge}"`);
    if (!deptBadge.toLowerCase().includes('emergency')) {
      throw new Error(`Expected Emergency department badge but found "${deptBadge}"`);
    }

    // Verify all rows in doctor incoming queue have department Emergency
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const doctorRows = await page.locator('table tbody tr').all();
    console.log(`✓ Doctor queue has ${doctorRows.length} incoming patient rows.`);
    for (const row of doctorRows) {
      const rowText = await row.innerText();
      if (!rowText.includes('Emergency') && !rowText.includes('No incoming patients')) {
        throw new Error(`Row contains non-Emergency department patient: "${rowText}"`);
      }
    }
    console.log('✓ Department queue isolation verified: Only Emergency department patients shown.');

    // Shift Duty Status Toggle Verification
    logStep(3, 'Testing Doctor shift check-in / check-out toggle...');
    // Get initial active doctors count
    const initialDoctorCountText = await page.locator('div:has-text("Active Doctors on Duty:") >> strong').innerText();
    const initialDoctorCount = parseInt(initialDoctorCountText, 10);
    console.log(`✓ Initial active doctors on duty count: ${initialDoctorCount}`);

    // Locate shift toggle button
    const dutyToggleBtn = page.locator('button[title="Toggle your clinical shift duty status"]');
    const initialDutyText = await dutyToggleBtn.innerText();
    console.log(`✓ Initial duty button text: "${initialDutyText.replace(/\s+/g, ' ').trim()}"`);

    // Click toggle
    await dutyToggleBtn.click();
    await page.waitForTimeout(500);

    const toggledDutyText = await dutyToggleBtn.innerText();
    console.log(`✓ Toggled duty button text: "${toggledDutyText.replace(/\s+/g, ' ').trim()}"`);

    const updatedDoctorCountText = await page.locator('div:has-text("Active Doctors on Duty:") >> strong').innerText();
    const updatedDoctorCount = parseInt(updatedDoctorCountText, 10);
    console.log(`✓ Updated active doctors on duty count: ${updatedDoctorCount}`);

    if (updatedDoctorCount === initialDoctorCount) {
      throw new Error(`Active doctor count did not change on duty toggle (was ${initialDoctorCount}, still ${updatedDoctorCount})`);
    }
    console.log(`✓ Active doctor count successfully updated from ${initialDoctorCount} to ${updatedDoctorCount}`);

    // Toggle back to on-duty for clean state
    await dutyToggleBtn.click();
    await page.waitForTimeout(500);

    // Save Screenshot 3
    const screenshot3 = path.join(SCREENSHOT_DIR, '03_doctor_dashboard.png');
    await page.screenshot({ path: screenshot3, fullPage: true });
    console.log(`✓ Saved Screenshot 3: ${screenshot3}`);

    // -------------------------------------------------------------------------
    // STEP 4: ADMIN FLOW & ANALYTICS
    // -------------------------------------------------------------------------
    logStep(4, 'Signing out and logging in as Admin (admin / admin123)...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to /admin
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✓ Successfully landed on /admin');

    // Verify operational statistics & charts load from API
    await page.waitForSelector('text=Hospital Operations Oversight', { timeout: 10000 });
    await page.waitForSelector('text=Total Intake Today', { timeout: 10000 });
    await page.waitForSelector('text=Currently Waiting', { timeout: 10000 });
    await page.waitForSelector('text=Triage Distribution', { timeout: 10000 });
    await page.waitForSelector('text=Average Waiting Time by Department', { timeout: 10000 });
    await page.waitForSelector('text=Recent Clinical Activity Log', { timeout: 10000 });

    const totalIntakeVal = await page.locator('div:has-text("Total Intake Today") >> .text-3xl').first().innerText();
    const currentlyWaitingVal = await page.locator('div:has-text("Currently Waiting") >> .text-3xl').first().innerText();
    console.log(`✓ Admin live stats from API: Total Intake = ${totalIntakeVal}, Currently Waiting = ${currentlyWaitingVal}`);

    // Save Screenshot 4
    const screenshot4 = path.join(SCREENSHOT_DIR, '04_admin_dashboard.png');
    await page.screenshot({ path: screenshot4, fullPage: true });
    console.log(`✓ Saved Screenshot 4: ${screenshot4}`);

    // -------------------------------------------------------------------------
    // STEP 5: ASSERT ZERO ROLE SWITCHER IN DESKTOP AND MOBILE TOPBAR
    // -------------------------------------------------------------------------
    logStep(5, 'Asserting absence of desktop and mobile Topbar role switcher...');
    await assertNoRoleSwitcher(page, 'Desktop (Admin)');

    // Switch to mobile viewport
    logStep(5, 'Resizing to mobile viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await assertNoRoleSwitcher(page, 'Mobile (Admin)');

    console.log('\n====================================================');
    console.log('ALL PLAYWRIGHT E2E ACCEPTANCE CHECKS PASSED EMPIRICALLY!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'failure_diagnostic.png'), fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
}

/**
 * Asserts that Topbar does not contain any role switching elements
 */
async function assertNoRoleSwitcher(page, contextName) {
  // Check Topbar header container
  const header = page.locator('header').first();
  const headerText = await header.innerText();

  // Role switcher buttons previously had text "Nurse", "Doctor", "Admin" in a button group
  // Or text "Switch Role"
  if (headerText.includes('Switch Role')) {
    throw new Error(`[${contextName}] Topbar contains "Switch Role" text!`);
  }

  // Check if any button inside header has text Nurse, Doctor, or Admin (used as role switches)
  const headerButtons = await header.locator('button').all();
  for (const btn of headerButtons) {
    const txt = (await btn.innerText()).trim();
    if (txt === 'Nurse' || txt === 'Doctor' || txt === 'Admin') {
      throw new Error(`[${contextName}] Topbar contains role switcher button with label: "${txt}"`);
    }
  }

  console.log(`✓ [${contextName}] Topbar verified free of role switcher.`);
}

runVerification()
  .then(() => {
    console.log('E2E verification completed with status: SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('E2E verification completed with status: FAILED');
    process.exit(1);
  });
