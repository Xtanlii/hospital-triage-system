# Intelligent Patient Triage & Hospital Queue Management System - Backend

Production-grade RESTful API server built with **Node.js**, **Express.js**, and **PostgreSQL (via Prisma ORM)**.

---

## 1. System Architecture

The backend implements the three-part clinical workflow:

```text
       Patient Intake (Registration / Demographics)
                           ↓
                   REST API Server
                           ↓
            ML Inference Service (:8000/predict)
                           ↓
       Acuity Prediction (Critical, High, Moderate, Low)
                           ↓
   Clinical Priority Queue (Acuity Hierarchy + FIFO arrival)
                           ↓
          Administrative Dashboard & Alerts
```

### Key Modules:
1. **Intake & Clinical Assessment**: Collects patient vitals and chief complaint code.
2. **Inference Integration**: Sends clinical features to an external Machine Learning model and receives acuity classifications (`Critical`, `High`, `Moderate`, `Low`) with confidence scores.
3. **Clinical Priority Queue**: Dynamically positions patients according to acuity urgency, recalculating positions whenever queue state changes.
4. **Waiting-Time Alerts**: Monitors waiting times against acuity-specific thresholds and flags patients who have waited too long.
5. **Role-Based Security**: Distinguishes clinical privileges (`NURSE`) from administrative and system privileges (`ADMIN`).

---

## 2. Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/client`) & raw SQL scripts (`pgcrypto` UUIDs)
- **Authentication**: JWT (JSON Web Tokens) with `Authorization: Bearer <token>`
- **Security**: `helmet`, `cors`, `bcryptjs` password hashing, `express-rate-limit`
- **Logging**: `winston` structured logger with sensitive data redaction
- **Testing**: Jest & Supertest

---

## 3. Directory Structure

```text
server/
├── database/
│   ├── schema.sql           # Raw PostgreSQL DDL with pgcrypto, constraints, and indexes
│   └── seed.sql             # SQL seed data (Admin, Nurses, Patients, Queue)
├── prisma/
│   ├── schema.prisma        # Prisma schema models, indexes, relations
│   └── seed.js              # Prisma database seeder
├── src/
│   ├── config/
│   │   ├── db.js            # Prisma client instance and health check
│   │   └── env.js           # Environment variable configuration
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── queueController.js
│   │   ├── triageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── validationMiddleware.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── queueRoutes.js
│   │   ├── triageRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── mlService.js
│   │   ├── notificationService.js
│   │   ├── patientService.js
│   │   ├── queueService.js
│   │   └── triageService.js
│   ├── utils/
│   │   ├── acuityUtils.js
│   │   ├── logger.js
│   │   └── queueUtils.js
│   ├── app.js               # Express application configuration
│   └── server.js            # Server entrypoint and lifecycle
├── tests/
│   ├── auth.test.js
│   ├── queue.test.js
│   └── triage.test.js
├── .env.example
├── package.json
└── README.md
```

---

## 4. Environment Variables

Create a `.env` file inside `server/` (copied from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/patient_triage

# JWT Configuration
JWT_SECRET=super_secret_triage_jwt_key_change_in_production_2026
JWT_EXPIRES_IN=1d

# External ML Inference Service
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=5000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

---

## 5. PostgreSQL Database Setup

### Option A: Using Prisma (Recommended)
1. Ensure PostgreSQL is running and a database named `patient_triage` exists:
   ```bash
   createdb -U postgres patient_triage
   ```
2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
3. Push the schema to the database:
   ```bash
   npx prisma db push
   ```
4. Seed the database:
   ```bash
   node prisma/seed.js
   ```

### Option B: Using Native SQL Scripts
Execute `database/schema.sql` and `database/seed.sql`:
```bash
psql -U postgres -d patient_triage -f database/schema.sql
psql -U postgres -d patient_triage -f database/seed.sql
```

---

## 6. How to Run the Server

```bash
# Development mode (with nodemon auto-restart)
npm run dev

# Production start
npm start
```

Health check is available at:
`http://localhost:5000/health`

---

## 7. Starting the ML Inference Service

The triage engine integrates with a Python/FastAPI ML service listening at `http://localhost:8000`:
```bash
# Example FastAPI ML runner
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Expected endpoint: `POST /predict`
If the ML service is down or times out, the backend strictly returns `503 ML Service Unavailable` without saving invalid queue entries.

---

## 8. Clinical Priority Queue Algorithm

Rather than simple FIFO (First In, First Out), hospital patients are ordered by **clinical acuity**:

1. **Primary Ordering**: Acuity Level
   - **Tier 1 (Highest)**: `Critical` (Immediate resuscitation / Emergency)
   - **Tier 2**: `High` (Urgent / Critical Care)
   - **Tier 3**: `Moderate` (General Medical)
   - **Tier 4 (Lowest)**: `Low` (Outpatient / Minor Care)
2. **Secondary Ordering**: Arrival Time (`queued_at ASC`)
   - For patients with identical acuity, the earlier arrival is placed first.
3. **Dynamic Recalculation**:
   - Queue positions (1, 2, 3...) are updated automatically whenever a patient enters the queue, is called, attended, or cancelled.

### Wait-Time Thresholds
- `Critical`: **10 minutes**
- `High`: **30 minutes**
- `Moderate`: **60 minutes**
- `Low`: **120 minutes**

The system triggers alerts when active waiting times exceed these limits.

---

## 9. API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new nurse or admin
- `POST /api/auth/login` — Login and receive Bearer JWT
- `GET /api/auth/me` — Retrieve current user profile

#### Sample Login Request:
```json
POST /api/auth/login
{
  "username": "nurse.sarah",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "user_id": "a0000000-0000-0000-0000-000000000002",
      "full_name": "Nurse Sarah Connor",
      "username": "nurse.sarah",
      "role": "NURSE"
    }
  }
}
```

---

### Patients (`/api/patients`)
- `POST /api/patients` — Register new patient
- `GET /api/patients?page=1&limit=20&search=smith` — Search & list patients
- `GET /api/patients/:id` — Get patient by ID (includes history)
- `PUT /api/patients/:id` — Update patient demographics
- `GET /api/patients/:id/triage` — Patient assessment history
- `GET /api/patients/:id/queue` — Patient queue history

#### Sample Register Patient:
```json
POST /api/patients
Headers: Authorization: Bearer <token>
{
  "first_name": "Arthur",
  "last_name": "Dent",
  "date_of_birth": "1982-03-11",
  "gender": "Male",
  "phone_number": "+1-555-0101"
}
```

---

### Triage (`/api/triage`)
- `POST /api/triage` — Submit clinical assessment and trigger ML prediction + queue placement
- `GET /api/triage/:assessmentId` — Retrieve specific assessment

#### Sample Triage Request:
```json
POST /api/triage
Headers: Authorization: Bearer <token>
{
  "patient_id": "b0000000-0000-0000-0000-000000000001",
  "systolic_bp": 185,
  "diastolic_bp": 115,
  "heart_rate": 130,
  "respiratory_rate": 28,
  "spo2": 89.5,
  "temperature": 37.8,
  "pain_score": 9,
  "chief_complaint_code": 101
}
```
Response:
```json
{
  "success": true,
  "message": "Triage assessment completed, ML inference recorded, and patient added to priority queue",
  "data": {
    "assessment": { "assessment_id": "...", "patient_id": "...", ... },
    "prediction": {
      "predicted_acuity": "Critical",
      "confidence_score": "0.9650",
      "model_used": "Random Forest"
    },
    "queueEntry": {
      "queue_id": "...",
      "acuity_level": "Critical",
      "department": "Emergency",
      "queue_position": 1,
      "status": "Waiting"
    },
    "patient": {
      "patient_id": "...",
      "full_name": "Arthur Dent",
      "age": 44
    }
  }
}
```

---

### Priority Queue (`/api/queue`)
- `GET /api/queue?status=Waiting&department=Emergency` — Active queue list
- `GET /api/queue/:id` — Queue entry details
- `PATCH /api/queue/:id/status` — Update status (`Waiting`, `Called`, `In Progress`, `Completed`, `Cancelled`)
- `PATCH /api/queue/:id/attend` — Mark patient attended (`Completed`) & recalculate positions
- `PATCH /api/queue/:id/cancel` — Cancel queue entry & recalculate positions

---

### Admin Dashboard (`/api/admin`) *(Admin Role Required)*
- `GET /api/admin/dashboard` — Overview metrics, counts by acuity, average wait time, and active alerts
- `GET /api/admin/queue` — Full hospital queue view
- `GET /api/admin/alerts` — Patients exceeding permitted wait times
- `GET /api/admin/statistics` — Triage aggregates by acuity, department, and ML model
- `GET /api/admin/patients` — Admin patients listing
- `GET /api/admin/assessments` — All triage assessments
- `GET /api/admin/predictions` — All ML predictions

---

## 10. Default Seed Credentials

| Role  | Username      | Password      |
|-------|---------------|---------------|
| ADMIN | `admin`       | `admin123`    |
| NURSE | `nurse.sarah` | `password123` |
| NURSE | `nurse.john`  | `password123` |

---

## 11. Testing

Run automated tests:
```bash
npm test
```
Runs unit and integration tests covering:
- Authentication & JWT validation
- Role authorization
- Patient validation and registration
- Clinical vitals validation
- Priority queue ordering algorithm
- ML inference error handling (503)

