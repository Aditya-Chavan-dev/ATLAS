# Phase 1: Ground Rules & System Boundaries (Exhaustive Analysis)
**Status:** ✅ Complete
**Confidence:** HIGH (Based on direct code inspection)

## 1. Executive Summary
ATLAS is a **Hybrid-Cloud Event-Consistent System** with a "Backend Monopoly" on data mutation. It enforces **Zero-Trust** for clients, relying on a Firebase-Node.js bridge for all business logic. Time is axiomatically defined as **IST (UTC+05:30)**, and concurrency is managed via a custom **Distributed Mutex** on Firebase RTDB.

---

## 2. Trust Model & System Boundaries

### 2.1 The "Backend Monopoly" (Zero-Trust Client)
The system assumes the client is compromised.
*   **Rule**: `database.rules.json` explicitly sets `.write: false` for all business data (`attendance`, `leaves`, `audit_logs`).
*   **Implication**: No client-side logic can ever directly modify the state.
*   **Enforcement**: All writes route to `server/src/controllers/*.js`.
*   **Vulnerability**: If `database.rules.json` is ever disabled/relaxed, the entire system integrity collapses.

### 2.2 Network Trust (CORS)
*   **Allowed Origins**:
    *   `https://atlas-011.web.app` (Production)
    *   `https://atlas-011.firebaseapp.com` (Production Mirror)
    *   `http://localhost:5173` & `5174` (Development)
*   **Mechanism**: `cors` middleware in `server/src/app.js`.
*   **Gap**: No `Origin` verification for mobile apps (Postman/cURL can access API if they have a valid ID Token). **Security relies 100% on tokens, 0% on Network Origin.**

---

## 3. The "Physics" of Time (Axiomatic Assumptions)

### 3.1 Hardcoded IST
Time does not exist relative to the user. It exists relative to **New Delhi (UTC+05:30)**.
*   **Code Evidence**: `server/src/utils/dateUtils.js`
    ```javascript
    const istOffset = 5.5 * 60 * 60 * 1000; // Hardcoded float
    const istDate = new Date(now.getTime() + istOffset);
    ```
*   **Risks**:
    1.  **Daylight Savings**: If India ever adopts DST (unlikely but possible), code breaks.
    2.  **Global Expansion**: System is unusable outside India without refactoring.
    3.  **Midnight Edge Case**: An employee in New York marking attendance at 2 PM EST (12:30 AM IST) will be marking for "Tomorrow".

### 3.2 Distributed Concurrency (The Mutex)
*   **Mechanism**: A custom `Mutex` class in `server/src/utils/mutex.js`.
*   **Logic**: Uses `db.ref('locks/{uid}').transaction()` to claim a lock.
*   **Timeout**: Hardcoded 5000ms safety valve (`acquire(timeoutMs = 5000)`).
*   **Critique**: This is a robust, lock-based solution to the "Double-Submit" race condition.

---

## 4. Environment & Build Constraints

### 4.1 "Demo Mode" Isolation (The Hidden Feature)
There is a massive, undocumented feature in `firebase.json`:
```json
"rewrites": [
    { "source": "/demo/**", "destination": "/demo.html" }
]
```
*   **Impact**: `/demo` loads a completely different HTML entry point (`demo.html`) than the main app (`index.html`).
*   **Code Reference**: `firebase.json:12`.
*   **Why?** This prevents the heavy main bundle from loading for demo users, or provides a mocked experience.

### 4.2 Dependency Locks
*   **Runtime**: `node: "20.x"` (Required by Render/`package.json`).
*   **Frontend**: `react: "^19.2.0"` (Bleeding Edge).
*   **Build**: `vite: "^7.2.4"` (Next-gen build tool).
*   **Risk**: Being on React 19 (RC/Beta versions) means potential instability or breaking changes in libraries that expect React 18.

---

## 5. Failure Modes & Edge Cases Identified

### 5.1 The "Orphaned Lock" Scenario
*   **Trace**: `mutex.js` acquires a lock at `locks/{uid}`.
*   **Failure**: If the Node.js process crashes *after* acquiring but *before* releasing.
*   **Recovery**: The next request checks `if (now - current > timeoutMs)`.
*   **Result**: System self-heals after 5 seconds. Users are blocked for max 5s. **Excellent resilience.**

### 5.2 The "Zombie Admin"
*   **Trace**: `authMiddleware.js`
*   **Scenario**: Admin is fired. Google Auth token is valid for 1 hour.
*   **Mitigation**: Every sensitive request performs a **Real-time DB Lookup** (`db.ref('employees/'+uid)`).
*   **Result**: Access is revoked instantly (within ms), ignoring Token Expiry.

---

## 6. Implicit Assumptions Surface

1.  **"The Network is Reliable"**: The frontend assumes it can always reach the backend. There is no offline-queue for *Backend* mutations (only for Firebase Reads).
2.  **"Firestore is Read-Only"**: `firestore.rules` blocks ALL writes. The system assumes Firestore is only populated by Cloud Functions (triggers).
3.  **"Admins are Few"**: The `verifyTokenAndRole` does a DB read on every request. If you had 10,000 admins, this would be a bottleneck. (Valid assumption for this use case).

---

## 7. Interview Prep (Phase 1 Specifics)

**Q: "Why did you implement a custom Mutex instead of using Redis locks?"**
*A: "For our scale, adding Redis infrastructure (cost/complexity) wasn't justified. We utilized the existing Realtime Database transactions to implement a distributed lock with a 5s TTL. It gave us 'Exactly-Once' processing for leave applications without new infrastructure."*

**Q: "How do you handle 'Time' in a distributed system?"**
*A: "We explicitly rejected client-side timestamps. We treat the Server as the Single Source of Truth, forcing all events to normalize to IST (UTC+05:30). This avoids the 'User changed their phone clock' attack vector entirely."*
