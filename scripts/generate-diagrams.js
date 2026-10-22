const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const htmlDiagrams = {
  '00_system_architecture.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; }
        .card { width: 960px; margin: 0 auto; border: 2px solid #cbd5e1; border-radius: 12px; padding: 28px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        h2 { text-align: center; color: #0f172a; margin: 0 0 8px 0; font-size: 20px; }
        p.sub { text-align: center; color: #64748b; margin: 0 0 24px 0; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 40px 1.25fr 40px 1fr; align-items: center; gap: 8px; }
        .tier { border-radius: 10px; padding: 16px; min-height: 280px; box-sizing: border-box; }
        .tier-pres { background: #eff6ff; border: 2px solid #3b82f6; }
        .tier-mid { background: #f0fdf4; border: 2px solid #16a34a; }
        .tier-data { background: #faf5ff; border: 2px solid #9333ea; }
        .badge { color: white; padding: 6px 12px; font-weight: bold; border-radius: 6px; text-align: center; margin-bottom: 14px; font-size: 13px; letter-spacing: 0.5px; }
        .b-blue { background: #2563eb; }
        .b-green { background: #16a34a; }
        .b-purple { background: #9333ea; }
        .box { background: #ffffff; border-radius: 6px; padding: 10px; margin-bottom: 10px; font-size: 12px; border: 1px solid #e2e8f0; }
        .box-title { font-weight: bold; color: #1e293b; margin-bottom: 4px; font-size: 12px; }
        .arrow { text-align: center; font-size: 24px; font-weight: bold; color: #94a3b8; }
        ul { margin: 4px 0 0 16px; padding: 0; color: #475569; font-size: 11px; line-height: 1.5; }
        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Figure 4.1: Three-Tier System Architecture Diagram</h2>
        <p class="sub">Intelligent Patient Triage and Hospital Queue Management System</p>
        <div class="grid">
          
          <div class="tier tier-pres">
            <div class="badge b-blue">Presentation Tier (Client)</div>
            <div class="box">
              <div class="box-title">React 18 SPA (Vite)</div>
              <ul>
                <li>Nurse Triage Station (/nurse)</li>
                <li>Physician Station (/doctor)</li>
                <li>Hospital Oversight (/admin)</li>
              </ul>
            </div>
            <div class="box" style="background: #f8fafc;">
              <div class="box-title" style="color: #2563eb;">UI Engine & Security</div>
              <ul>
                <li>Tailwind CSS Responsive Design</li>
                <li>Role-based Protected Routes</li>
                <li>Local Storage JWT Auth State</li>
              </ul>
            </div>
          </div>

          <div class="arrow">⇄</div>

          <div class="tier tier-mid">
            <div class="badge b-green">Middle Tier (API & Inference Services)</div>
            <div class="box">
              <div class="box-title">Node.js & Express REST Core (Port 5000)</div>
              <ul>
                <li>Authentication & JWT Verification</li>
                <li>Dynamic Multi-factor Queue Prioritization</li>
                <li>Departmental Queue Scoping & Routing</li>
                <li>Offline Clinical Rule Engine Fallback</li>
              </ul>
            </div>
            <div style="text-align: center; font-size: 14px; font-weight: bold; color: #16a34a; margin: 4px 0;">⇅ Internal HTTP (/predict)</div>
            <div class="box" style="border: 1px dashed #16a34a; background: #f0fdf4;">
              <div class="box-title" style="color: #15803d;">Python Flask Inference Service (Port 8000)</div>
              <ul>
                <li>Pre-trained XGBoost Model (SMOTE)</li>
                <li>38-Feature Extraction & Bound Check</li>
                <li>Missingness & Unconscious Patient Handler</li>
              </ul>
            </div>
          </div>

          <div class="arrow">⇄</div>

          <div class="tier tier-data">
            <div class="badge b-purple">Data Tier (Persistence)</div>
            <div class="box">
              <div class="box-title">PostgreSQL 18 Database</div>
              <ul>
                <li>Users & Role-based Credentials</li>
                <li>Patient Demographic Records</li>
                <li>Triage Vitals & Clinical Data</li>
                <li>Active Departmental Queues</li>
                <li>Clinical Overrides & Audit Logs</li>
              </ul>
            </div>
            <div class="box" style="background: #fdf4ff;">
              <div class="box-title" style="color: #9333ea;">Prisma ORM (v7+)</div>
              <ul>
                <li>Type-Safe Data Access Layer</li>
                <li>Declarative Schema Migrations</li>
                <li>ACID Transaction Guarantees</li>
              </ul>
            </div>
          </div>

        </div>
        <div class="footer">
          Self-Contained Local Hospital Intranet Deployment — Zero External Cloud or Internet Dependencies
        </div>
      </div>
    </body>
    </html>
  `,
  '00b_module_block_diagram.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; }
        .card { width: 920px; margin: 0 auto; border: 2px solid #cbd5e1; border-radius: 12px; padding: 28px; background: #ffffff; }
        h2 { text-align: center; color: #0f172a; margin: 0 0 6px 0; font-size: 20px; }
        p.sub { text-align: center; color: #64748b; margin: 0 0 24px 0; font-size: 13px; }
        .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .mod { flex: 1; border-radius: 8px; padding: 16px; border: 2px solid #cbd5e1; }
        .mod-h { font-size: 14px; font-weight: bold; margin: 0 0 8px 0; }
        .mod-p { font-size: 11.5px; color: #334155; margin: 0; line-height: 1.5; }
        .con { font-size: 26px; color: #64748b; font-weight: bold; padding: 0 16px; }
        .center-arrow { text-align: center; font-size: 26px; color: #64748b; font-weight: bold; margin: 6px 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Figure 4.1b: Functional Module Linkages Diagram</h2>
        <p class="sub">Structured API and Data Linkages Across System Sub-Modules</p>
        
        <div class="row">
          <div class="mod" style="background: #eff6ff; border-color: #3b82f6;">
            <div class="mod-h" style="color: #1d4ed8;">1. Triage Assessment Module</div>
            <p class="mod-p">
              • Patient registration & vital signs entry<br>
              • Input bounds validation & sanity checks<br>
              • Dispatches intake payload to API
            </p>
          </div>
          <div class="con" style="color: #3b82f6;">➔</div>
          <div class="mod" style="background: #ecfdf5; border-color: #10b981;">
            <div class="mod-h" style="color: #047857;">2. Prediction & Scoring Module</div>
            <p class="mod-p">
              • XGBoost model loads preprocessed features<br>
              • Computes Shock Index & dual imputation<br>
              • Outputs ESI acuity (1-5) & manual alert
            </p>
          </div>
        </div>

        <div class="center-arrow">↓</div>

        <div class="row">
          <div class="mod" style="background: #fffbeb; border-color: #f59e0b;">
            <div class="mod-h" style="color: #b45309;">3. Queue Management Module</div>
            <p class="mod-p">
              • Dynamic clinical priority queue sorter<br>
              • Multi-factor ranking: Acuity &gt; Wait Time<br>
              • Department isolation & physician dispatch
            </p>
          </div>
          <div class="con" style="color: #f59e0b;">➔</div>
          <div class="mod" style="background: #fdf2f8; border-color: #ec4899;">
            <div class="mod-h" style="color: #be185d;">4. Administrative Oversight Module</div>
            <p class="mod-p">
              • Real-time waiting time & intake statistics<br>
              • ESI triage distribution visualization<br>
              • Nurse clinical override audit logging
            </p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `,
  '00c_data_flow_diagram.png': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; }
        .card { width: 960px; margin: 0 auto; border: 2px solid #cbd5e1; border-radius: 12px; padding: 26px; background: #ffffff; }
        h2 { text-align: center; color: #0f172a; margin: 0 0 6px 0; font-size: 20px; }
        p.sub { text-align: center; color: #64748b; margin: 0 0 20px 0; font-size: 13px; }
        .step-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .ent { border: 2px solid #0284c7; background: #f0f9ff; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #0369a1; text-align: center; width: 160px; }
        .proc { border: 2px solid #16a34a; background: #f0fdf4; padding: 10px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #15803d; text-align: center; width: 190px; }
        .flow-txt { font-size: 11px; color: #64748b; font-weight: 600; text-align: center; padding: 0 10px; }
        .store-box { border-top: 3px solid #334155; border-bottom: 3px solid #334155; background: #f8fafc; padding: 12px 20px; text-align: center; width: 480px; margin: 12px auto; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Figure 4.1c: Overall Data Flow Diagram (DFD Level 1)</h2>
        <p class="sub">Data Movement from Intake Source through Prediction to Dashboards</p>
        
        <div class="step-row">
          <div class="ent">
            [Entity: Source]<br>Triage Nurse
          </div>
          <div class="flow-txt">── Vitals &amp; Symptoms ──▶</div>
          <div class="proc">
            1.0 Intake Form<br>&amp; Validation
          </div>
          <div class="flow-txt">── Clean Vitals JSON ──▶</div>
          <div class="proc" style="border-color: #7c3aed; background: #faf5ff; color: #7c3aed;">
            2.0 Acuity Scoring<br>(XGBoost Inference)
          </div>
        </div>

        <div class="store-box">
          <strong style="color: #0f172a;">D1: PostgreSQL Database (patient_triage)</strong><br>
          <span style="font-size: 11px; color: #475569;">Tables: users, patients, triage_assessments, queue_tickets, clinical_overrides</span>
        </div>

        <div class="step-row">
          <div class="proc" style="border-color: #ea580c; background: #fff7ed; color: #c2410c;">
            3.0 Dynamic Queue<br>Prioritization
          </div>
          <div class="flow-txt">── Prioritized Queue ──▶</div>
          <div class="ent">
            [Entity: Sink]<br>Physician Station
          </div>
          <div class="flow-txt">── Operations Analytics ──▶</div>
          <div class="ent">
            [Entity: Sink]<br>Hospital Administrator
          </div>
        </div>

      </div>
    </body>
    </html>
  `
};

async function run() {
  const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const [name, html] of Object.entries(htmlDiagrams)) {
    await page.setContent(html);
    const element = await page.locator('.card');
    const outPath = path.join(OUT_DIR, name);
    await element.screenshot({ path: outPath });
    console.log(`[OK] Generated: ${outPath}`);
  }

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
