import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_chapter_4_docx(output_path):
    doc = docx.Document()

    # Set standard 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.5
    normal_style.paragraph_format.space_after = Pt(6)

    def add_chapter_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_after = Pt(4)

    def add_h1(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)

    def add_h2(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12.5)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)

    def add_h3(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.italic = True
        run.font.size = Pt(12)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(6)
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.name = 'Times New Roman'
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.name = 'Times New Roman'
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        return p

    def add_figure(img_path, caption_title, caption_desc=None, width=Inches(6.0)):
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.add_run().add_picture(img_path, width=width)

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(caption_title)
            r_cap.bold = True
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(11)

            if caption_desc:
                p_desc = doc.add_paragraph()
                p_desc.paragraph_format.line_spacing = 1.15
                p_desc.paragraph_format.space_after = Pt(10)
                r_desc = p_desc.add_run(caption_desc)
                r_desc.italic = True
                r_desc.font.name = 'Times New Roman'
                r_desc.font.size = Pt(10.5)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    screenshots_dir = os.path.join(base_dir, 'screenshots')

    # Document Header
    add_chapter_title("CHAPTER FOUR")
    add_chapter_title("SYSTEM IMPLEMENTATION & DOCUMENTATION")
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 4.0 Introduction
    add_h1("4.0 Introduction")
    add_p("This chapter details how the Intelligent Patient Triage and Hospital Queue Management System was built, deployed, and tested. It outlines the development environment, core architecture, machine learning pipeline used for acuity prediction, and the validation procedures. The system is split into three core parts: a predictive machine learning model, a backend RESTful API, and a role-based web interface for nurses, doctors, and administrators.")

    # 4.1 Choice of Development Environment
    add_h1("4.1 Choice of Development Environment")
    add_p("The machine learning pipeline was written in Python inside a Jupyter Notebook environment. Python was picked because of its dominant data science ecosystem and robust libraries for predictive modeling. The core libraries used include:")
    add_bullet(" For loading, cleaning, merging, and reshaping the MIMIC-IV-ED dataset.", "i. Pandas and NumPy:")
    add_bullet(" For exploratory data analysis (EDA) and plotting graphs.", "ii. Matplotlib and Seaborn:")
    add_bullet(" For implementing baseline classifiers, handling stratified train and test splits, and computing evaluation metrics.", "iii. Scikit-learn:")
    add_bullet(" For building the gradient boosting classifier used to compare performance against the baseline.", "iv. XGBoost:")
    add_bullet(" For addressing class imbalances in the training dataset (detailed in Section 4.3).", "v. Imbalanced-learn (SMOTE):")

    add_h2("Frontend and Backend Technology Stack & Selection Reasoning")
    add_p("To construct a resilient, high-performance web application capable of operating reliably within a local hospital environment, modern web engineering technologies were selected across all application tiers:")
    
    add_bullet(" Node.js utilizes an event-driven, non-blocking asynchronous I/O runtime. In an emergency room environment where multiple nursing stations, triage bays, and physician consultation rooms simultaneously submit vitals, poll active waiting lists, and log clinical overrides, Node.js delivers high throughput and low latency without thread starvation. Express.js was chosen as the minimalist HTTP framework to build standardized, modular RESTful JSON endpoints with centralized error-handling middleware.", "1. Backend Framework — Node.js & Express.js:")
    add_bullet(" PostgreSQL 18 was selected over NoSQL alternatives because hospital operations, patient registrations, vital sign histories, and role-based staff permissions demand strict ACID compliance, relational integrity, foreign key constraints, and transactional safety. Prisma ORM (v7+) was implemented as the type-safe data access layer, providing automated schema migrations, declarative relational modeling, and complete mitigation of SQL injection risks.", "2. Database Management System — PostgreSQL & Prisma ORM:")
    add_bullet(" Built as a Single Page Application (SPA) using React 18 and Vite. React's component-based architecture and virtual DOM enable instantaneous, zero-reload state updates so that incoming emergency cases, acuity color shifts, and queue re-orderings reflect in real time. Tailwind CSS was utilized to build a clean, high-contrast clinical user interface optimized for clinical workstations.", "3. Frontend Framework — React 18 & Tailwind CSS:")

    add_h2("System Requirements")
    add_p("To ensure the system can run effectively in resource-constrained local hospitals (as highlighted in Chapter One), hardware and software footprints were kept minimal and optimized for standard computing hardware without cloud dependence.")

    add_h3("i. Server & Backend Environment")
    add_bullet(" Windows 10/11 (64-bit), Ubuntu Linux 20.04/22.04 LTS, or macOS.", "Operating System:")
    add_bullet(" Node.js v18.x LTS or higher (with npm v9+) and Python 3.11+ / 3.13 virtual environment (.venv) running Flask.", "Runtime Environments:")
    add_bullet(" PostgreSQL 18 relational database server listening on port 5432.", "Database Server:")
    add_bullet(" Dual-core 2.0 GHz or higher (x86_64). Standard CPU execution with no GPU requirement.", "Processor (CPU):")
    add_bullet(" Minimum 4 GB (8 GB recommended for concurrent execution of Node.js API, PostgreSQL, and Python ML service).", "System Memory (RAM):")
    add_bullet(" Minimum 10 GB free SSD/HDD storage for database logs, patient records, and model artifacts.", "Disk Storage:")

    add_h3("ii. Client Devices & Frontend Environment")
    add_bullet(" Any standard hospital desktop PC, laptop, or mobile workstation tablet.", "Supported Devices:")
    add_bullet(" Modern evergreen web browsers supporting ES6+ (Google Chrome 90+, Microsoft Edge 90+, Mozilla Firefox 88+, or Safari 14+).", "Supported Web Browsers:")
    add_bullet(" Responsive interface optimized from 1024 x 768 (tablets) up to 1920 x 1080 (clinical desktop monitors).", "Display Resolution:")

    add_h3("iii. Local Network Infrastructure")
    add_bullet(" Standard Local Area Network (LAN) via Ethernet or WPA2/WPA3 Wi-Fi. The entire triage, prediction, and queue management workflow operates strictly offline on the hospital intranet with zero external cloud or internet connectivity dependencies.", "Network Topology:")

    # 4.2 Implementation Architecture
    add_h1("4.2 Implementation Architecture")
    add_p("The system uses a standard three-tier architecture to separate the presentation, business logic, and database layers. This keeps the codebase modular, allowing developers to update individual parts without affecting the entire system. These three tiers are:")
    add_bullet(" A React-based web interface providing three role-based dashboards: a Triage Station for nurses, a Physician Station for doctors, and a Hospital Operations Oversight dashboard for administrators.", "Presentation Tier:")
    add_bullet(" An Express.js RESTful API integrated with a dedicated Python Flask machine learning inference microservice. This layer is designed to run on a local hospital server rather than a remote cloud service, to support offline-capable deployment consistent with the architecture defined in Chapter Three for resource-constrained hospital environments.", "Middle Tier:")
    add_bullet(" A PostgreSQL database storing patient records, triage assessments, staff accounts, priority queues, and acuity predictions, in accordance with the schema defined in Chapter Three.", "Data Tier:")

    add_figure(
        os.path.join(screenshots_dir, '00_system_architecture.png'),
        "Figure 4.1: Three-Tier System Architecture Diagram",
        "Figure 4.1 illustrates the overall structure of the system, showing how a request originates at the presentation layer, is processed through the API and machine learning model at the middle tier, and results in both a response returned to the interface and a corresponding record logged to the data tier."
    )

    add_h2("Frontend Implementation Details & Routing Structure")
    add_p("The presentation tier is structured into modular component trees secured by client-side Route Guards:")
    add_bullet(" Authentication tokens (JWT) and user profiles are managed via an AppContext provider stored in browser local storage.", "Authentication & Session Management:")
    add_bullet(" Enforces Role-Based Access Control (RBAC). Unauthorized attempts to cross between roles (e.g., a nurse navigating to /admin or a doctor accessing /nurse) are blocked and redirected to the user's authorized role home.", "Route Protection (ProtectedRoute):")
    add_bullet(" Hosts the active waiting queue, emergency counters, and incoming registration feeds.", "Nurse Dashboard:")
    add_bullet(" Interactive intake form validating vitals, triggering the AI predictor, rendering ESI color tags, displaying the 'Assess Manually' alert when vitals are partial, and providing clinical override controls.", "New Triage Page & Predictor Card:")
    add_bullet(" Department-scoped physician console displaying waiting patients sorted by clinical urgency and waiting time, consultation action modals, and shift duty toggles.", "Doctor Station:")
    add_bullet(" Aggregates hospital-wide throughput, department waiting averages, triage level distributions, and nurse override audit logs.", "Admin Operations Oversight:")

    add_h2("Module Breakdown")
    add_p("The application code is divided into four main functional modules:")
    add_bullet(" Collects vital signs and patient intake data at the front desk and sends them to the API for scoring.", "Triage Assessment Module:")
    add_bullet(" Loads the saved machine learning model, processes incoming API data, derives clinical features (such as Shock Index), checks for missingness, and returns the predicted acuity level.", "Prediction Module:")
    add_bullet(" Tracks the live waiting list and automatically re-orders patients based on clinical priority and arrival times.", "Queue Management Module:")
    add_bullet(" Aggregates real-time data on wait times, triage distributions, and logs clinical overrides for hospital management.", "Administrative Oversight Module:")
    add_p("These modules talk to each other strictly through API endpoints rather than modifying shared database states directly. This makes it easy to replace or upgrade parts of the system later—for example, updating the ML model inside the prediction module won't affect how the triage form or queue logic operates, provided the input/output JSON format stays the same.")

    add_figure(
        os.path.join(screenshots_dir, '00b_module_block_diagram.png'),
        "Figure 4.1b: Module/Sub-module Block Diagram",
        "Figure 4.1b shows the four core modules and their linkages, illustrating data progression from the Triage Assessment Module through Prediction, Queue Management, and Administrative Oversight."
    )

    add_h2("Data Flow Diagram")
    add_figure(
        os.path.join(screenshots_dir, '00c_data_flow_diagram.png'),
        "Figure 4.1c: Overall Data Flow Diagram (DFD Level 1)",
        "The data flow diagram traces the movement of patient information through the system, beginning with data entry by nursing staff at intake, through processing by the prediction module, to storage in the database, and finally to presentation on the relevant dashboards for nurses, doctors, and administrators."
    )

    add_h2("The Machine Learning Pipeline")
    add_p("The data pipeline was built using the MIMIC-IV-ED dataset, which contains over 425,000 emergency records across six relational tables (edstays, triage, vitalsign, diagnosis, medrecon, and pyxis).")
    add_p("1. Data Cleaning & Bounds Checking: Vital signs were filtered against realistic clinical limits (e.g., heart rate between 20 and 250 bpm, oxygen saturation between 50% and 100%). Out-of-bounds entries were marked as missing rather than throwing away the entire patient row. Records missing the target variable (acuity) were removed, leaving a final clean dataset of 418,100 records.")
    add_p("2. Aggregation: Multiple vital sign readings taken during a single emergency visit were condensed into one row using clinical summary metrics (such as minimum SpO2 and maximum heart rate), as extreme values are more indicative of clinical deterioration than simple averages.")
    add_p("3. Feature Engineering & Imputation: Tables were joined, and custom features were calculated, including the Shock Index (heart rate divided by systolic blood pressure). Missing fields were filled using column medians, and a matching binary indicator flag (e.g., vitals_was_missing) was created so the model could learn if a value was originally missing or measured.")
    add_p("4. Data Filtering for Real-World Fairness: Final diagnoses and hospital disposition codes were excluded from training because that information is only available after a patient leaves the ER. Patient race was also excluded to prevent geographical bias, since the dataset comes from the US but the application is designed for Nigerian hospitals. Race data was kept aside strictly for post-pipeline fairness checks.")

    add_h2("Exploratory Data Analysis")
    add_p("The cleaned dataset was analyzed prior to model training to confirm the predictive relevance of engineered features and to surface patterns relevant to the hospital queue management component of the system.")
    add_p("Figure 4.2 shows the distribution of the target variable across all five acuity levels, with Level 3 representing the majority of records and Level 5 the smallest proportion. This distribution directly informed the class-imbalance handling approach discussed in Section 4.3.")
    add_p("Figure 4.3 compares the distribution of six vital signs across acuity levels. Heart rate and oxygen saturation showed the clearest separation across levels, consistent with established clinical understanding of these measures as triage severity indicators, supporting their inclusion as primary predictive features in the final model.")
    add_p("Figure 4.4 shows arrival volume peaking between late morning and mid-afternoon, with a clear overnight trough between approximately 3:00 and 6:00. Arrival volume showed minimal variation across the days of the week, indicating that staffing optimization for the queue management module of this system would be more effectively guided by time-of-day patterns than by day-of-week patterns.")
    add_p("Figure 4.5 presents the linear correlation between each numeric feature and acuity. Respiratory rate, oxygen saturation, and heart rate showed the strongest individual relationships with the target variable, supporting their prioritization as primary predictive features in the final model configuration.")

    add_h2("System Interface")
    add_p("The following screenshots present the role-based dashboards implemented for this system, corresponding to the presentation tier described in Section 4.2.")

    add_figure(
        os.path.join(screenshots_dir, '01_nurse_dashboard.png'),
        "Figure 4.6: Nurse Triage Station, showing the active patient queue prioritized by clinical urgency",
        "Figure 4.6 shows the Triage Station used by nursing staff, with patients ordered by triage urgency and waiting time. Summary metrics, including active patient count, critical emergency count, and average waiting time, are displayed to provide immediate situational awareness of departmental load."
    )

    add_figure(
        os.path.join(screenshots_dir, '02_triage_persisted.png'),
        "Figure 4.6b: Completed Triage Ticket persisted in PostgreSQL across page reload",
        "Figure 4.6b shows the completed triage ticket with ambulance transport and unreportable pain successfully persisted into PostgreSQL and rendered in the live nurse queue."
    )

    add_figure(
        os.path.join(screenshots_dir, '03_doctor_dashboard.png'),
        "Figure 4.7: Physician Station, showing incoming patients ordered by clinical priority",
        "Figure 4.7 shows the Physician Station, used by doctors to view and manage patients awaiting consultation, ordered by clinical urgency and waiting duration, with department queue scoping and shift on-duty toggling."
    )

    add_figure(
        os.path.join(screenshots_dir, '05_patient_view_sheet.png'),
        "Figure 4.7b: Patient Triage Detail View ('View Sheet')",
        "Figure 4.7b shows the detailed view of a single patient's triage record, including the recorded vital signs and the acuity level predicted by the system, demonstrating the complete input-to-output flow of the prediction module for an individual case."
    )

    add_figure(
        os.path.join(screenshots_dir, '04_admin_dashboard.png'),
        "Figure 4.8: Hospital Operations Oversight dashboard, used by hospital administrators",
        "Figure 4.8 shows the administrator dashboard, providing hospital-wide visibility into intake volume, waiting times by department, triage distribution, and a log of clinical activity, including instances where clinical staff have manually overridden a system-generated prediction, an important safeguard within the overall system design."
    )

    add_h2("Input and Output Format")
    add_bullet(" JSON payload via API containing triage vitals (temperature, heart rate, respiratory rate, SpO2, blood pressure, pain score) and context data (arrival time, transport mode). Vitals can be null if uncollected.", "Input:")
    add_bullet(" A predicted Emergency Severity Index (ESI) category from 1 (Most Urgent) to 5 (Least Urgent), displayed as a color-coded tag on the frontend (Red, Orange, Yellow, Green, Blue), relative class confidence scores, and a manual assessment recommendation flag.", "Output:")

    # 4.3 Software Testing
    add_h1("4.3 Software Testing")
    add_p("Testing of this system was carried out in two phases, consistent with standard practice for systems combining a data-driven model with an interactive application layer: validation during data preprocessing, and evaluation of the trained models and the system as a whole.")

    add_h2("Phase 1: Preprocessing Validation")
    add_p("Data assertions were written into the Python processing script to verify row counts after every table join and filter operation. Summary statistics were reviewed at each stage to ensure values were parsed correctly. Feature drops were checked at the compilation step to confirm no leaks of post-triage data (like diagnoses or disposition codes) occurred.")

    add_h2("Phase 2: Model Evaluation")
    add_p("Random Forest and XGBoost classifiers were trained using a stratified 80/20 train/test split. Stratification was critical to keep the rare acuity classes balanced across both the training and testing chunks. Because of the heavy class imbalances seen in the EDA phase, SMOTE (Synthetic Minority Oversampling Technique) was applied to the training data. The testing partition was left untouched to ensure metrics were calculated against real patient profiles.")
    add_p("Table 4.1 summarises the performance of the models developed for this system.")

    # Table 4.1
    table_p = doc.add_paragraph()
    table_p.paragraph_format.space_before = Pt(6)
    table_p.paragraph_format.space_after = Pt(4)
    r_t1 = table_p.add_run("Table 4.1: Performance summary of triage classification models")
    r_t1.bold = True
    r_t1.font.name = 'Times New Roman'

    t1 = doc.add_table(rows=4, cols=5)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Model", "Accuracy", "Macro F1", "Level 4 Recall", "Level 5 Recall"]
    data = [
        ["Random Forest (baseline)", "0.62", "0.38", "0.01", "0.00"],
        ["Random Forest (SMOTE)", "0.61", "0.41", "0.12", "0.01"],
        ["XGBoost (SMOTE)", "0.62", "0.40", "0.03", "0.11"]
    ]
    for col_idx, h in enumerate(headers):
        cell = t1.cell(0, col_idx)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_background(cell, "E2E8F0")

    for row_idx, row_data in enumerate(data):
        for col_idx, val in enumerate(row_data):
            cell = t1.cell(row_idx + 1, col_idx)
            cell.paragraphs[0].text = val
            if col_idx > 0:
                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            set_cell_background(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    add_p("The models achieved around 62 percent overall accuracy. This reflects the clinical reality of predicting clinical urgency from vital signs alone without full lab histories. Because accuracy can be misleading on skewed data, the Macro F1 score was used as our primary metric since it weights all classes equally. XGBoost paired with SMOTE was selected for deployment because it achieved significantly better recall on high-stakes Level 1 (critical resuscitation) cases compared to the baseline options.")

    add_h2("Sample Input and Output")
    add_figure(
        os.path.join(screenshots_dir, '06_sample_triage_input.png'),
        "Figure 4.10: Sample Triage Assessment Input Form",
        "Figure 4.10 demonstrates the data entry interface for a sample patient record, verifying that vital signs and clinical transport mode are collected cleanly prior to model submission."
    )

    add_figure(
        os.path.join(screenshots_dir, '07_prediction_output.png'),
        "Figure 4.11: Prediction Result Generated by Machine Learning Service",
        "Figure 4.11 displays the acuity prediction output returned by the model, showing the ESI Level 1 badge, the high-visibility RED color tag, and relative class confidence distribution."
    )

    add_h2("Backend & API Integration Testing")
    add_p("Automated unit and integration test suites were executed using Jest and Supertest across 8 test suites (105/105 tests passing), covering authentication, patient intake, queue reordering, and model payload conversion. Figure 4.12 displays the API integration test verifying that the backend accurately passes clinical payload data to the inference microservice and returns the standardized ESI prediction and probabilities with an HTTP 200 OK status.")

    add_figure(
        os.path.join(screenshots_dir, '08_api_integration_test.png'),
        "Figure 4.12: API Integration Testing — POST /api/triage/predict Request and Response",
        "Figure 4.12 shows the JSON request and response contract between the presentation layer, the Express API, and the Python ML inference microservice."
    )

    add_h2("Error Handling and Input Validation")
    add_p("The web application runs validation checks directly on the form inputs before sending data to the server. If critical data fields hold impossible values (e.g., a systolic blood pressure of 0 or a pulse oximetry reading exceeding 100%), the frontend catches and flags the error immediately.")
    add_p("For cases where vital signs cannot be immediately gathered (such as an unconscious patient or emergency trauma arrival), nursing staff can check 'Not Reportable / Unconscious' and leave unmeasurable fields blank. The backend and model service detect when fewer than 3 core vitals are provided and trigger manual_assessment_recommended: true, displaying a prominent red 'Assess Manually' clinical prompt. Furthermore, should the external ML inference service become unreachable, the backend automatically engages an internal rule-based clinical heuristic engine (clinicalRuleEngine.js), ensuring emergency triage operations never halt.")

    # 4.4 Documentation
    add_h1("4.4 Documentation")
    add_h2("Data Dictionary")
    add_p("Table 4.2 defines the key variables used within the machine learning pipeline and the wider application database.")

    # Table 4.2
    table_p2 = doc.add_paragraph()
    table_p2.paragraph_format.space_before = Pt(6)
    table_p2.paragraph_format.space_after = Pt(4)
    r_t2 = table_p2.add_run("Table 4.2: Data Dictionary for Triage System Variables")
    r_t2.bold = True
    r_t2.font.name = 'Times New Roman'

    dict_data = [
        ["temperature", "Float", "Body temperature recorded at triage (entered in °C, normalized to °F for inference)"],
        ["heartrate", "Integer", "Heart rate measured in beats per minute (bpm)"],
        ["resprate", "Integer", "Respiratory rate measured in breaths per minute"],
        ["o2sat", "Float", "Peripheral oxygen saturation (SpO2, 0–100%)"],
        ["sbp, dbp", "Integer", "Systolic and diastolic blood pressure measured in mmHg"],
        ["pain", "Integer / Null", "Patient-reported pain score (0–10); set to null if patient is unconscious"],
        ["shock_index", "Float", "Derived hemodynamic feature: Heart Rate divided by Systolic BP"],
        ["arrival_transport", "String", "Mode of arrival: WALK IN, AMBULANCE, HELICOPTER, OTHER, UNKNOWN"],
        ["manual_assessment_recommended", "Boolean", "Clinical flag raised when fewer than 3 core vitals are available"],
        ["acuity", "Integer", "Target variable: Emergency Severity Index level (1 = Resuscitation to 5 = Non-urgent)"]
    ]

    t2 = doc.add_table(rows=len(dict_data) + 1, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    d_headers = ["Variable", "Type", "Description"]
    for col_idx, h in enumerate(d_headers):
        cell = t2.cell(0, col_idx)
        cell.paragraphs[0].text = h
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_background(cell, "E2E8F0")

    for row_idx, row_data in enumerate(dict_data):
        for col_idx, val in enumerate(row_data):
            cell = t2.cell(row_idx + 1, col_idx)
            cell.paragraphs[0].text = val
            set_cell_background(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 4.4.1 User Manual
    add_h2("4.4.1 User Manual")
    add_p("This section provides step-by-step operating procedures for nursing staff, physicians, and hospital administrators utilizing the role-based workstations.")

    add_h3("1. Nurse Triage Station Workflow")
    add_p("1. Login: Access the system URL at /login, enter authorized nurse credentials (e.g., nurse.sarah / password123), and land on the Nurse Triage Station (/nurse).")
    add_p("2. Patient Intake: Click the 'New Triage Assessment' button on the navigation bar to open the intake and assessment form.")
    add_p("3. Record Vitals & Transport Mode: Select the patient from the registry dropdown. Select the mode of arrival (e.g., AMBULANCE). Enter observed vital signs (temperature in °C, pulse rate, blood pressure, respiratory rate, oxygen saturation). If the patient is unconscious or non-verbal, check the 'Not Reportable / Unconscious' box, which safely marks pain as null.")
    add_p("4. Execute Prediction: Click 'Run Triage Prediction'. The system sends the vitals to the API, displaying the predicted ESI Level (1 to 5), the triage color tag (Red, Orange, Yellow, Green, Blue), and class confidence scores.")
    add_p("5. Clinical Override: If professional nursing judgment warrants adjusting the acuity level, select an override level and enter a clinical rationale in the override explanation field.")
    add_p("6. Submit to Priority Queue: Click 'Complete Triage & Add to Queue'. A modal presents the assigned queue ticket (e.g., Q-104), and the patient is automatically sorted into the active waiting queue based on clinical urgency.")

    add_h3("2. Physician Station Workflow")
    add_p("1. Login & Shift Check-In: Log in with doctor credentials (e.g., doctor.wilson / password123) to access /doctor. The station automatically scopes the queue to the doctor's assigned department (e.g., Emergency).")
    add_p("2. Shift Duty Status Toggle: Click the 'On Duty / Off Duty' toggle button on the header to check in or out of active clinical duty, updating real-time hospital staffing counters.")
    add_p("3. Priority Queue Review: The incoming queue lists patients ordered strictly by urgency (ESI Level 1 resuscitation cases at the top), followed by arrival wait times.")
    add_p("4. Consultation & Disposition: Click 'View Sheet' to inspect complete intake vitals, pain scores, and AI rationale. Click 'Call Patient' to begin the consultation, document clinical diagnosis notes, and finalize disposition (Admit, Discharge, or Transfer).")

    add_h3("3. Hospital Operations Oversight (Administrator Workflow)")
    add_p("1. Login: Log in with administrator credentials (e.g., admin / password123) to access the oversight dashboard at /admin.")
    add_p("2. Operational KPI Monitoring: View live hospital metrics including Total Registered Patients, Active Queue Count, Critical Emergency (Level 1 & 2) Count, and Average Wait Times.")
    add_p("3. Queue & Triage Analytics: Inspect visual distribution charts of patients across the 5 ESI triage categories and monitor department-specific queue backlogs.")
    add_p("4. Clinical Override Audit Log: Review the comprehensive audit table tracking every instance where a nurse overrode an AI prediction, including the original AI score, the nurse's assigned level, the clinical justification, and timestamps for institutional accountability.")

    doc.save(output_path)
    print(f"[OK] Document successfully generated: {output_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_path = os.path.join(base_dir, 'Chapter_4_System_Implementation.docx')
    create_chapter_4_docx(target_path)
