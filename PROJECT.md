# Project: Hospital Triage & Queue Management System

## Architecture
- **Client**: React 18, Vite 5, Tailwind CSS, Lucide icons, React Router DOM.
  - State management: `AuthContext` (JWT session), `AppContext` (patients, queue, departments, sync).
  - API Client: Service layer calling Express API via `/api` (proxied by Vite to port 5000).
- **Server**: Node.js, Express, Prisma 7, PostgreSQL, Jest.
  - Controllers: Auth, Patients, Triage, Queue, Doctor, Admin, Department.
  - Services: `triageService` (orchestrates triage lifecycle), `mlService` (dispatches to `ML_SERVICE_URL` with offline fallback), `queueService` (5-level priority queue with FIFO within acuity), `cacheService` (Redis with in-memory TTL Map fallback).
  - Data Store: PostgreSQL managed via Prisma (`schema.prisma`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | ML Payload Contract | Send exact documented fields (`temperature` in °F, `heartrate`, `resprate`, `o2sat`, `sbp`, `dbp`, `pain` nullable, `gender` "M"/"F", `arrival_transport` enum, `arrival_time` ISO) with uncollected as `null` | M1 | `ORIGINAL_REQUEST.md` R1 |
| 2 | Acuity & Colour Mapping | Map integer 1–5 output to 5 ESI levels & colours (1 Red/Immediate, 2 Orange/Emergent, 3 Yellow/Urgent, 4 Green/Less Urgent, 5 Blue/Non-urgent) | M1 | `ORIGINAL_REQUEST.md` R1, `model-readme.md` |
| 3 | Offline Fallback Bug Fixes | Fix `clinicalRuleEngine.js` so `null` vitals do not trigger Level 1 (`null < 85`); convert °F to °C before threshold checks | M1 | Survey Report (explorer_backend) |
| 4 | Prisma Schema Migration | Make vital columns nullable (`Int?`, `Decimal?`), add `arrival_transport`, `arrival_time`, and `acuity_color` | M1 | `ORIGINAL_REQUEST.md` R1, R2 |
| 5 | Department API Endpoint | Add `GET /api/departments` returning hospital departments | M1 | Survey Report (explorer_backend, explorer_frontend) |
| 6 | Database Seed Updates | Populate `arrival_transport`, `arrival_time`, and `acuity_color` on seeded assessments | M1 | Survey Report (explorer_testing) |
| 7 | Triage Form Nullable Vitals | Remove HTML `required`, allow any vital sign to be left blank (serialized as `null`) | M2 | `ORIGINAL_REQUEST.md` R2 |
| 8 | Triage Form Unreportable Pain | Add "Not Reportable / Unconscious" option setting `pain` to `null` | M2 | `ORIGINAL_REQUEST.md` R2 |
| 9 | Triage Form Arrival Transport | Add dropdown for 5 transport enum values (`AMBULANCE`, `WALK IN`, `HELICOPTER`, `OTHER`, `UNKNOWN`) | M2 | `ORIGINAL_REQUEST.md` R2 |
| 10 | Triage Form Arrival Time | Capture and pass ISO datetime `arrival_time` | M2 | `ORIGINAL_REQUEST.md` R2 |
| 11 | Temperature Unit Conversion | Nurse enters °C; converted to °F for model | M2 | `ORIGINAL_REQUEST.md` R2 |
| 12 | Nurse Prediction Override | Preserve clinician override capability with rationale | M2 | `ORIGINAL_REQUEST.md` R2 |
| 13 | Eliminate Frontend Mock Data | Refactor 7 client files (`AppContext.jsx` and 6 services) to call Express API; zero runtime `mockData` imports | M2 | `ORIGINAL_REQUEST.md` R3 |
| 14 | Real Auth & Role Mapping | Connect login form to `/api/auth/login`; normalize uppercase backend roles; remove auto-login to demo user | M2 | `ORIGINAL_REQUEST.md` R3 |
| 15 | Remove Dev-Mode Role Switcher | Remove Topbar desktop and mobile menu role switcher buttons | M2 | `ORIGINAL_REQUEST.md` R4 |
| 16 | Preserve Client Offline & Caching | Maintain `localStorage` caching and online/offline status | M2 | `ORIGINAL_REQUEST.md` R3 |
| 17 | Preserve Doctor Department Queues | Maintain department queue isolation and check-in/out | M2 | `ORIGINAL_REQUEST.md` R3 |
| 18 | Model Contract Automated Tests | Suite `server/tests/modelContract.test.js` covering payload interception, 1–5 ESI/colour mapping, and null vitals fallback | M3 / E2E Track | `ORIGINAL_REQUEST.md` AC Model Contract |
| 19 | UI Integration & Persistence E2E | Playwright E2E verification for Nurse/Doctor/Admin logins, dashboard data, triage submission, and queue persistence | M3 / E2E Track | `ORIGINAL_REQUEST.md` AC Integration |
| 20 | Code Quality & Regression Checks | Verify zero `mockData` imports, Topbar role switcher removed, all server Jest tests pass, client build succeeds | M3 / E2E Track | `ORIGINAL_REQUEST.md` AC Regression |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Model Contract & DB Alignment | `schema.prisma`, `seed.js`, `mlService.js`, `clinicalRuleEngine.js`, `acuityUtils.js`, `triageService.js`, `triageValidators.js`, `departmentController.js`, `departmentRoutes.js`, `app.js` | none | DONE |
| M2 | Frontend Integration & Dev-Mode Removal | `Topbar.jsx`, `LoginPage.jsx`, `AuthContext.jsx`, `NewTriagePage.jsx`, `apiClient.js`, 6 services, `AppContext.jsx` | M1 interface contracts | IN_PROGRESS |
| M3 | E2E Testing & Acceptance Verification | `server/tests/modelContract.test.js`, `scripts/verify-e2e.js`, regression verification, screenshots | M1, M2 | PLANNED |

## Interface Contracts

### Client ↔ Server: Triage Intake (`POST /api/triage`)
- Request Body:
  ```json
  {
    "patient_id": "UUID string",
    "arrival_transport": "AMBULANCE" | "WALK IN" | "HELICOPTER" | "OTHER" | "UNKNOWN",
    "arrival_time": "2026-10-20T16:00:00.000Z",
    "temperature": 37.0 | null,
    "temperature_unit": "C" | "F",
    "heart_rate": 78 | null,
    "respiratory_rate": 18 | null,
    "spo2": 98.0 | null,
    "systolic_bp": 120 | null,
    "diastolic_bp": 80 | null,
    "pain_score": 4 | null,
    "chief_complaint_code": 1 | null,
    "nurse_override": {
      "is_overridden": boolean,
      "override_acuity": "Immediate" | "Emergent" | "Urgent" | "Less Urgent" | "Non-urgent",
      "override_reason": string
    }
  }
  ```
- Response (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "assessment": { ... },
      "prediction": {
        "predicted_acuity": "Immediate" | "Emergent" | "Urgent" | "Less Urgent" | "Non-urgent",
        "acuity_color": "Red" | "Orange" | "Yellow" | "Green" | "Blue",
        "confidence_score": 0.85,
        "model_used": string,
        "is_offline_fallback": boolean
      },
      "queueEntry": { ... }
    }
  }
  ```

### Server ↔ External ML Service (`POST ${ML_SERVICE_URL}/predict`)
- Request Body (Payload must contain documented field names, types, and strict `null` for uncollected):
  ```json
  {
    "temperature": 98.6 | null,
    "heartrate": 78.0 | null,
    "resprate": 18.0 | null,
    "o2sat": 98.0 | null,
    "sbp": 120.0 | null,
    "dbp": 80.0 | null,
    "pain": 4.0 | null,
    "gender": "M" | "F",
    "arrival_transport": "AMBULANCE" | "WALK IN" | "HELICOPTER" | "OTHER" | "UNKNOWN",
    "arrival_time": "2026-10-20T16:00:00.000Z"
  }
  ```
- Response:
  `{ "predicted_acuity": 1..5 }` or raw integer `1..5`.

### Client ↔ Server: Departments (`GET /api/departments`)
- Response (200 OK):
  ```json
  {
    "success": true,
    "data": [
      { "id": "dept-1", "name": "Emergency", "description": "Critical and immediate care" },
      { "id": "dept-2", "name": "Emergency / Critical Care", "description": "High acuity resuscitation" },
      { "id": "dept-3", "name": "General Medical", "description": "Inpatient and medical admissions" },
      { "id": "dept-4", "name": "Outpatient", "description": "Non-urgent ambulatory care" }
    ]
  }
  ```

## Code Layout
- `server/prisma/schema.prisma`: Database schema definitions
- `server/prisma/seed.js`: Database seeding script
- `server/src/services/mlService.js`: External ML service client & offline fallback dispatch
- `server/src/utils/clinicalRuleEngine.js`: Offline rule-based ESI triage evaluation
- `server/src/utils/acuityUtils.js`: ESI acuity normalization, colours, departments, priority
- `server/src/services/triageService.js`: Triage intake orchestration
- `server/src/validators/triageValidators.js`: Intake payload validation
- `server/src/controllers/departmentController.js`: Department listing handler
- `server/src/routes/departmentRoutes.js`: `/api/departments` route definition
- `server/tests/modelContract.test.js`: New acceptance test suite for ML contract
- `client/src/services/apiClient.js`: Centralized Axios/fetch HTTP client with JWT interceptor
- `client/src/services/*.js`: Client domain services (`authService`, `patientService`, `queueService`, `triageService`, `departmentService`, `userService`)
- `client/src/context/AuthContext.jsx`: Authentication & user session context
- `client/src/context/AppContext.jsx`: Global hospital state & synchronization
- `client/src/components/common/Topbar.jsx`: Application header (role switcher removed)
- `client/src/pages/LoginPage.jsx`: Real credential login page
- `client/src/pages/nurse/NewTriagePage.jsx`: Triage intake form aligned with model contract
- `scripts/verify-e2e.js`: Playwright acceptance verification script
