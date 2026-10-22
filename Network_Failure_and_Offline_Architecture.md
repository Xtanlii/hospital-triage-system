# Network Failure Mechanisms & Offline Reliability Architecture

## Overview
This document specifies the fault tolerance, high-availability caching, and offline continuity mechanisms implemented in the **Intelligent Patient Triage & Queue Management System**. In a hospital environment, clinical intake and triage queueing must **never** be interrupted by network partitions, external service downtime, or database hiccups.

---

## 1. Network Failure Architecture

```
                  +----------------------------------------------+
                  |         Client Browser (Nurse / Doctor)      |
                  +----------------------------------------------+
                                         |
                       [1. Client-Side Cache & Local Outbox]
                                         |
                                         v
                  +----------------------------------------------+
                  |              Express API Gateway             |
                  +----------------------------------------------+
                         /                                \
                        /                                  \
                       v                                    v
       +-------------------------------+    +-------------------------------+
       |       Redis Cache Layer       |    |      ML Inference Service     |
       |  (Fallback: In-Memory Map)    |    |   (Fallback: Clinical ESI)    |
       +-------------------------------+    +-------------------------------+
                       |                                    |
                       v                                    v
       +-------------------------------+    +-------------------------------+
       |    PostgreSQL Database (Prisma)    |    |  5-Level Priority Queue Flow  |
       +-------------------------------+    +-------------------------------+
```

---

## 2. Answers to Clinical & System Resilience Questions

### i. Client-Side Caching
* **Implementation**: The frontend utilizes a multi-tiered client cache combining React state and persistent browser storage (`localStorage`).
* **Cached Entities**:
  * Active patient queue and urgency positions
  * Hospital department configurations and wait-time limits
  * Clinical vital signs thresholds and triage reference templates
  * Authenticated user session and permissions
* **Benefit**: If network latency spikes or a temporary disconnect occurs, the client UI remains snappy and displays cached hospital queue data without blank screens.

---

### ii. Server-Side Caching with Redis Client
* **Implementation** (`server/src/services/cacheService.js` & `server/src/config/redis.js`):
  * Connects to Redis via standard connection string (`REDIS_URL`).
  * Features **Resilient Graceful Degradation**:
    * If Redis is running and reachable: All reads/writes leverage Redis with configured TTLs (e.g. 30s for queue snapshots, 30s for admin analytics).
    * If Redis is down, disconnected, or uninstalled: The system automatically and transparently falls back to a high-speed **In-Memory TTL Cache (LRU Map)**.
  * **Zero Crashes**: Unhandled Redis network disconnections are caught and logged as non-fatal warnings.
  * **Targeted Invalidation**: Creating a new triage assessment, attending a patient, or updating a status automatically issues `cacheService.delPattern('queue:*')` and `cacheService.del('admin:dashboard')`.

---

### iii. What happens when the ML model is offline?
* **Problem**: In legacy designs, an unreachable ML server caused triage requests to fail with HTTP 503 (`MLServiceUnavailableError`), blocking emergency intake.
* **Solution (Dual-Engine Triage Pipeline)**:
  * When `mlService.predictAcuity` detects a network timeout (`AbortSignal.timeout`) or connection error (`ECONNREFUSED`):
  * Instead of throwing an error, it **automatically invokes the Clinical ESI Rule Engine** (`server/src/utils/clinicalRuleEngine.js`).
  * The assessment is safely persisted with:
    * `predicted_acuity`: Rule-determined ESI Level (Immediate, Emergent, Urgent, Less Urgent, Non-urgent)
    * `model_used`: `'Clinical ESI Rule Engine (Offline Fallback)'`
    * `confidence_score`: `0.90+`
    * `is_offline_fallback`: `true`
  * The patient is immediately placed into the hospital queue without delay.

---

### iv. Can the system run when there is no network?
* **Yes!** The system provides full disaster-recovery offline capability:
  1. **Local Network / Intranet Deployment**: The entire backend (Express + PostgreSQL + local cache) can run inside the hospital's local intranet (LAN) without requiring an active external internet connection.
  2. **Browser Offline Mode**:
     * If client-to-server connection drops, the browser catches network dropouts via `window.navigator.onLine`.
     * Triage forms remain operable; submitted intakes are staged in a local browser outbox (`offline_triage_queue`).
     * As soon as connectivity is restored, the outbox batch-syncs with the server.

---

### v. Can we run the ML model offline?
* **Yes, in two complementary ways**:
  1. **Deterministic Clinical Rule Engine (Active Fallback)**:
     * Written directly in JavaScript (`clinicalRuleEngine.js`).
     * Zero external dependencies, zero Python overhead, zero network calls.
     * Evaluates vital sign combinations (SpO2, heart rate, systolic BP, respiratory rate, temperature, pain score, age) using the official Emergency Severity Index (ESI) protocol.
  2. **Local Python ML Service or ONNX Runtime**:
     * The trained ML model (`model.pkl` or `.onnx`) can be co-located on the same physical server as the backend (running at `http://127.0.0.1:8000`).
     * Because communication happens over the internal loopback adapter (`localhost`), it requires no internet connection whatsoever.
