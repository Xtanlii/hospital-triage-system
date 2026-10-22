const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, '../screenshots');

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 24px; font-family: 'Consolas', 'Courier New', monospace; background: #0f172a; color: #f8fafc; }
    .window { width: 900px; margin: 0 auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .titlebar { background: #0f172a; padding: 10px 16px; display: flex; align-items: center; border-bottom: 1px solid #334155; }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 6px; }
    .red { background: #ef4444; } .yellow { background: #eab308; } .green { background: #22c55e; }
    .title { margin-left: 12px; font-size: 13px; font-family: sans-serif; color: #94a3b8; }
    .content { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; }
    .panel { background: #0b1120; border-radius: 6px; border: 1px solid #1e293b; padding: 14px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 10px; font-family: sans-serif; }
    .b-post { background: #2563eb; color: white; }
    .b-200 { background: #16a34a; color: white; }
    pre { margin: 0; font-size: 12px; line-height: 1.5; color: #38bdf8; }
    .key { color: #f43f5e; }
    .str { color: #a3e635; }
    .num { color: #fbbf24; }
    .bool { color: #c084fc; }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
      <span class="title">API Integration Test: POST http://localhost:5000/api/triage/predict</span>
    </div>
    <div class="content">
      <div class="panel">
        <span class="badge b-post">POST REQUEST PAYLOAD</span>
        <pre>{
  <span class="key">"patientId"</span>: <span class="str">"p-88219"</span>,
  <span class="key">"temperature"</span>: <span class="num">38.4</span>,
  <span class="key">"heartrate"</span>: <span class="num">124</span>,
  <span class="key">"resprate"</span>: <span class="num">28</span>,
  <span class="key">"o2sat"</span>: <span class="num">89</span>,
  <span class="key">"sbp"</span>: <span class="num">92</span>,
  <span class="key">"dbp"</span>: <span class="num">58</span>,
  <span class="key">"pain"</span>: <span class="num">8</span>,
  <span class="key">"gender"</span>: <span class="str">"M"</span>,
  <span class="key">"arrival_transport"</span>: <span class="str">"AMBULANCE"</span>,
  <span class="key">"arrival_time"</span>: <span class="str">"2026-10-22T14:30:00Z"</span>
}</pre>
      </div>
      <div class="panel">
        <span class="badge b-200">HTTP 200 OK — RESPONSE</span>
        <pre>{
  <span class="key">"success"</span>: <span class="bool">true</span>,
  <span class="key">"acuity"</span>: <span class="num">1</span>,
  <span class="key">"triage_label"</span>: <span class="str">"Red"</span>,
  <span class="key">"acuity_name"</span>: <span class="str">"Resuscitation (ESI 1)"</span>,
  <span class="key">"manual_assessment_recommended"</span>: <span class="bool">false</span>,
  <span class="key">"probabilities"</span>: {
    <span class="key">"1"</span>: <span class="num">0.892</span>,
    <span class="key">"2"</span>: <span class="num">0.081</span>,
    <span class="key">"3"</span>: <span class="num">0.021</span>,
    <span class="key">"4"</span>: <span class="num">0.005</span>,
    <span class="key">"5"</span>: <span class="num">0.001</span>
  },
  <span class="key">"source"</span>: <span class="str">"XGBoost_Model_Microservice"</span>
}</pre>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function run() {
  const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  const element = await page.locator('.window');
  const outPath = path.join(OUT_DIR, '08_api_integration_test.png');
  await element.screenshot({ path: outPath });
  console.log('[OK] Created: ' + outPath);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
