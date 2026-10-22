const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, '../screenshots');

const htmlCards = {
  '05_patient_view_sheet.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; }
        .sheet { width: 750px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 24px; }
        .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
        .p-name { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0; }
        .p-sub { font-size: 13px; color: #64748b; }
        .badge-red { background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
        .grid-vitals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .v-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .v-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
        .v-val { font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 4px; }
        .v-alert { color: #dc2626; font-size: 11px; margin-top: 2px; }
        .sec-title { font-size: 14px; font-weight: bold; color: #334155; margin-bottom: 8px; }
        .diag-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; font-size: 13px; color: #166534; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="hdr">
          <div>
            <h3 class="p-name">Arthur Dent (PID: PT-10492)</h3>
            <div class="p-sub">Gender: Male • Age: 42 • Transport: AMBULANCE • Arrival: 14:15 Today</div>
          </div>
          <span class="badge-red">ESI Level 1 — Resuscitation (Red)</span>
        </div>
        
        <div class="sec-title">Recorded Clinical Vital Signs at Intake</div>
        <div class="grid-vitals">
          <div class="v-box"><div class="v-lbl">Heart Rate</div><div class="v-val">128 bpm</div><div class="v-alert">Severe Tachycardia</div></div>
          <div class="v-box"><div class="v-lbl">Blood Pressure</div><div class="v-val">90/58 mmHg</div><div class="v-alert">Hypotensive</div></div>
          <div class="v-box"><div class="v-lbl">SpO2 (Pulse Ox)</div><div class="v-val">89%</div><div class="v-alert">Hypoxia (&lt;90%)</div></div>
          <div class="v-box"><div class="v-lbl">Respiratory Rate</div><div class="v-val">28 bpm</div><div class="v-alert">Tachypneic</div></div>
          <div class="v-box"><div class="v-lbl">Temperature</div><div class="v-val">38.4 °C</div><div class="v-alert">Febrile</div></div>
          <div class="v-box"><div class="v-lbl">Pain Scale</div><div class="v-val">8 / 10</div><div class="v-alert">Severe Retrosternal</div></div>
        </div>

        <div class="sec-title">AI Triage Assessment Summary</div>
        <div class="diag-box">
          <strong>Machine Learning Inference:</strong> Model predicted Acuity Level 1 (Resuscitation) based on multi-parameter hemodynamic instability (Shock Index = 1.42, severe hypoxia SpO2 89%, hypotensive BP). Automatically placed at top of Emergency Queue. Assigned to Resuscitation Bay 1.
        </div>
      </div>
    </body>
    </html>
  `,
  '06_sample_triage_input.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; }
        .form-card { width: 720px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1; padding: 22px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
        .field { display: flex; flex-direction: column; }
        label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
        input, select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #f8fafc; color: #0f172a; }
        .btn { background: #2563eb; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; text-align: center; border: none; cursor: pointer; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="form-card">
        <div class="title">Figure 4.10: Completed Patient Intake & Vitals Data Entry</div>
        <div class="row">
          <div class="field"><label>Patient Full Name</label><input type="text" value="Arthur Dent" readonly></div>
          <div class="field"><label>Arrival Mode</label><select><option>AMBULANCE (Emergency)</option></select></div>
        </div>
        <div class="row">
          <div class="field"><label>Heart Rate (BPM)</label><input type="text" value="128" readonly></div>
          <div class="field"><label>Blood Pressure (Systolic / Diastolic)</label><input type="text" value="90 / 58" readonly></div>
        </div>
        <div class="row">
          <div class="field"><label>SpO2 Saturation (%)</label><input type="text" value="89" readonly></div>
          <div class="field"><label>Respiratory Rate (BPM)</label><input type="text" value="28" readonly></div>
        </div>
        <div class="row">
          <div class="field"><label>Temperature (°C)</label><input type="text" value="38.4" readonly></div>
          <div class="field"><label>Pain Score (0 - 10)</label><input type="text" value="8" readonly></div>
        </div>
        <div class="btn">Ready for AI Scoring ➔ [Run Triage Prediction]</div>
      </div>
    </body>
    </html>
  `,
  '07_prediction_output.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; }
        .card { width: 680px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .title { font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px; }
        .res-box { display: flex; align-items: center; justify-content: space-between; background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 18px 24px; }
        .lvl { font-size: 26px; font-weight: 900; color: #b91c1c; }
        .tag { background: #dc2626; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px; }
        .prob-bar { margin-top: 18px; font-size: 12px; color: #475569; background: #f1f5f9; padding: 10px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">Figure 4.11: Machine Learning Prediction Result Card</div>
        <div class="res-box">
          <div>
            <div class="lvl">Acuity Level 1 (ESI 1)</div>
            <div style="font-size: 13px; color: #7f1d1d; margin-top: 4px;">Immediate Clinical Resuscitation Required</div>
          </div>
          <div class="tag">Color Tag: RED</div>
        </div>
        <div class="prob-bar">
          <strong>Relative Class Model Confidence:</strong><br>
          Level 1 (Red): 89.2% | Level 2 (Orange): 8.1% | Level 3 (Yellow): 2.1% | Level 4/5: &lt;1%
        </div>
      </div>
    </body>
    </html>
  `
};

async function run() {
  const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
  const page = await browser.newPage();
  for (const [name, html] of Object.entries(htmlCards)) {
    await page.setContent(html);
    const element = await page.locator('div').first();
    const outPath = path.join(OUT_DIR, name);
    await element.screenshot({ path: outPath });
    console.log('[OK] Created: ' + outPath);
  }
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
