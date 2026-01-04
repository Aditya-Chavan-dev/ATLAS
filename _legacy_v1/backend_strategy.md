# Banking-Grade Backend Strategy & Security Roadmap

## 1. Security Hardening (Immediate)
We have a good foundation, but "Banking-Grade" requires defense-in-depth.

### A. HTTP Security Headers (Helmet)
**Constraint:** The server currently exposes default Express headers (`X-Powered-By`).
**Enforcement:**
-   Implement `helmet` to set strict HTTP headers (HSTS, No-Sniff, XSS Filter).
-   Hide `X-Powered-By` completely.

### B. Input Validation (Zero Trust)
**Constraint:** Currently, we rely on frontend validation. The backend assumes incoming JSON is valid.
**Enforcement:**
-   Implement `zod` or `joi` middleware for **schema validation**.
-   Reject any payload with "unknown keys" (Strip Unknown).
-   Sanitize all inputs to prevent NoSQL injection via object manipulation.

### C. Parameter Pollution Prevention
**Constraint:** Express handles duplicate query parameters poorly by default.
**Enforcement:**
-   Implement `hpp` middleware to block HTTP Parameter Pollution attacks.

### D. Advanced Rate Limiting
**Constraint:** We have basic rate limiting.
**Enforcement:**
-   Implement "Login Brute Force" protection (stricter limit on `/auth`).
-   Implement "IP-based Blocking" for repeated offenders (fail2ban style).

---

## 2. Proposed Backend Features

### A. Immutable Audit Logging
**Feature:** "Who did what, when?"
**Implementation:**
-   Create an `AuditService` that runs interceptors on POST/PUT/DELETE.
-   Log `Timestamp`, `ActorID`, `Action`, `Resource`, `IP_Address`, `User-Agent`.
-   Write to a separate `audit_logs` node in Firebase (or Firestore for better querying).
-   **Rule**: Admin actions (changing permissions, exporting data) *must* be logged.

### B. Automated & Manual Backups
**Feature:** "Disaster Recovery"
**Implementation:**
-   Create a **Backup Controller** (`/api/system/backup`).
-   Allow Admins to trigger a "Full DB Snapshot" download (`.json` or `.enc`).
-   (Optional) Daily scheduled backups to cloud storage.

### C. System Health & Deep Monitoring
**Feature:** "Is the DB alive?"
**Implementation:**
-   Enhance `/` (Root) to perform a "Deep Health Check".
-   Measure `DB_LATENCY` (Time to read 1 byte from Firebase).
-   Return `STATUS: DEGRADED` if latency > 500ms.

### D. Dynamic Role-Based Access Control (RBAC)
**Feature:** "Granular Permissions"
**Implementation:**
-   Move away from hardcoded role checks (`verifyTokenAndRole(['admin', 'hr'])`).
-   Implement a `permissions` object in `roleConfig`.
-   Check permissions: `verifyPermission('CAN_EXPORT_DATA')`.

---

## 3. Implementation Plan

### Phase 1: Shield Up (Security)
1.  `npm install helmet hpp compression zod`
2.  Configure `app.js` with new middleware.
3.  Create `src/middleware/validate.js` generic validator.

### Phase 2: Visibility (Audit & Health)
1.  Create `src/services/AuditService.js`.
2.  Hook Audit Logging into `authController` and `employeeController`.
3.  Update Root route for Deep Health Check.

### Phase 3: Resilience (Backup)
1.  Create `systemController.js`.
2.  Implement `backupDatabase` method using Firebase Admin SDK `export`.
