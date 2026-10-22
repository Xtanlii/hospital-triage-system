# E2E Test Infra: Hospital Triage & Queue Management System

## Test Philosophy
- Opaque-box, requirement-driven test verification based on `ORIGINAL_REQUEST.md`, `model-readme.md`, and system specifications.
- Dual testing architecture:
  1. Automated server-level Jest suites (`server/tests/modelContract.test.js`) verifying payload serialization, unit conversions, null preservation, ESI 1–5 level and colour mapping, and offline fallback resilience.
  2. End-to-end integration verification (`scripts/verify-e2e.js`) executing native headless Microsoft Edge via Playwright to verify multi-role authentication (Nurse, Doctor, Admin), live API data consumption, triage workflow, and queue persistence across reloads.
  3. Static codebase verification checking zero runtime `mockData` imports and complete removal of dev-mode role switcher UI.

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Test Level | Verification Mechanism |
|---|---------|-------------------|:----------:|------------------------|
| 1 | ML Payload Contract | `ORIGINAL_REQUEST.md` R1 | Tier 1 / Unit | Jest spy on `fetch` verifying documented fields, types, °F temp, nulls |
| 2 | ESI Acuity & Colour Mapping | `ORIGINAL_REQUEST.md` R1 | Tier 1 / Unit | Jest parameterized test over 1..5 asserting levels and colors |
| 3 | Offline Fallback with Null Vitals | `ORIGINAL_REQUEST.md` R1 | Tier 2 / Boundary | Jest test simulating network error with null vitals; asserts correct ESI without `0 < 85` bug |
| 4 | Nurse Dashboard & Seeded API Data | `ORIGINAL_REQUEST.md` R3 | Tier 4 / E2E | Playwright login as `nurse.sarah`; asserts seeded queue visible from API; screenshot |
| 5 | Triage Intake & Queue Persistence | `ORIGINAL_REQUEST.md` R2, R3 | Tier 4 / E2E | Playwright submit intake; assert in queue; page reload; assert still present; screenshot |
| 6 | Doctor Department Isolation & Duty | `ORIGINAL_REQUEST.md` R3 | Tier 4 / E2E | Playwright login as `doctor.wilson`; verify department filtering and check-in/out; screenshot |
| 7 | Admin Analytics Dashboard | `ORIGINAL_REQUEST.md` R3 | Tier 4 / E2E | Playwright login as `admin`; verify analytics stats from API; screenshot |
| 8 | Role Switcher Removal | `ORIGINAL_REQUEST.md` R4 | Tier 1 / Static | Assert absence of role switcher in Topbar UI via Playwright & DOM selector |
| 9 | Zero Runtime `mockData` Imports | `ORIGINAL_REQUEST.md` R3 | Tier 1 / Static | `git grep -n "mockData" client/src` returns zero matches in active code |
| 10 | Regression Safety | `ORIGINAL_REQUEST.md` Regression | Full Suite | All server Jest suites pass `--runInBand`; client `npm run build` succeeds |

## Test Architecture
- **Server Test Runner**:
  - Invocable via: `cmd.exe /c "node node_modules/jest/bin/jest.js --runInBand --forceExit"` in `server/`
  - Runs in-band against PostgreSQL database.
- **E2E Test Runner**:
  - Invocable via: `cmd.exe /c "node scripts/verify-e2e.js"`
  - Launches pre-installed Microsoft Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
  - Stores visual evidence in `screenshots/`.
- **Static Verification**:
  - `cmd.exe /c "git grep -n mockData client/src/"`
  - `cmd.exe /c "npm run build"` in `client/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| 1 | Unconscious Patient Intake | Blank vitals, unreportable pain, ambulance transport | Sent as nulls, evaluated by offline fallback safely, saved to DB |
| 2 | Shift Start & Doctor Attendance | Doctor login, duty toggle, queue inspection | Only department queue shown, duty count increments |
| 3 | High Acuity Patient Insertion | Level 1 patient triaged while Level 3 waiting | Acuity prioritization moves Level 1 patient to head of queue |
| 4 | Page Refresh Resilience | Queue data loaded from API into client state | Reload re-fetches from API / cache without losing triaged patient |

## Coverage Thresholds
- 100% of acceptance criteria in `ORIGINAL_REQUEST.md` covered by automated tests.
- 0 failed test suites in `server/`.
- 0 errors in `client/` production build.
- 0 runtime `mockData` references in `client/src/`.
