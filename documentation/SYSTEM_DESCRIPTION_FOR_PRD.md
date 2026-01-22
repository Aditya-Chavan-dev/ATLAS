# ATLAS System Description & Product Requirements Context

## 1. Executive Summary
**Product Name:** ATLAS (Attendance Tracking & Leave Application System)
**Primary Goal:** To act as an **"Incorruptible Timekeeper"** for an organization, eliminating the need for trust between Employer and Employee regarding attendance.
**Core Philosophy:** "The Client is Hostile." The system assumes any data coming from the client device could be manipulated, so it relies on a strict **"Backend Monopoly"** architecture where only the server can write to the official ledger.

---

## 2. User Personas & Roles

### 1. The Owner (Super Admin)
*   **Goal:** Total oversight and control without administrative burden.
*   **Key Features:**
    *   **User Management:** Assign roles (MD, Employee, HR) via a bulk-action dashboard.
    *   **Master Override:** Ability to correct any record.
    *   **Audit View:** See who authorized what change.

### 2. The Managing Director (MD / Approver)
*   **Goal:** Efficiently manage team availability.
*   **Key Features:**
    *   **Approve/Reject Leaves:** Instant feedback on request.
    *   **Daily Roster:** View who is "In", "Absent", or "On Leave" in real-time.

### 3. The Employee
*   **Goal:** Frictionless attendance marking and transparency.
*   **Key Features:**
    *   **Mark Attendance:** One-tap action.
    *   **Instant Feedback:** See "Pending" or "Approved" immediately.
    *   **Leave Balance:** Transparent view of accrued/remaining leave.
    *   **History:** Immutable log of their own work timestamps.

---

## 3. Functional Requirements (Features)

### Module A: Authentication & Identity
**Status:** ✅ Phase 1 Implemented (Frontend) / 🚧 Phase 2 Planned (Backend Hardening)

*   **Google OAuth:** No password management. Users sign in with their corporate/personal Google account.
*   **Email Whitelist (Implemented):** Strictly fail-closed system. Only emails pre-approved in the Firestore `/users` collection can sign in. Unrecognized emails are instant-banned.
*   **Role-Based Access Control (RBAC):**
    *   **Frontend (Implemented):** UI routes based on token claims (`role: 'owner' | 'md' | 'employee'`).
    *   **Backend (Planned):** Strict enforcement where the backend rejects any request from an unauthorized role, regardless of frontend state.
*   **Token Versioning (Planned):** Ability to instantly revoke all sessions for a user by incrementing a `token_version` counter in the database, forcing a global logout.

### Module B: Attendance Management ("The Iron Dome")
**Status:** 🚧 In Progress (Migration to Render Backend)

*   **Offline-First Architecture (Implemented):**
    *   When an employee marks attendance, it is saved instantly to **IndexedDB** and the UI updates (Optimistic UI).
    *   A background sync process sends the data to the server when online.
    *   **Benefit:** Works in basements/elevators with poor connectivity.
*   **Trustless Validation (Planned / v2 Architecture):**
    *   **No GPS:** GPS is spoofable and privacy-invasive. ATLAS does not use it.
    *   **Server Time:** The client sends a "request", but the **Server** stamps the time (`new Date()`). User cannot fake time by changing phone clock.
    *   **Device Verification (Critical Planned Feature):** The system must bind a User ID to a specific `DeviceID`. Use of a new device requires Admin approval. Prevents "Buddy Punching" (giving credentials to a friend to mark attendance).
    *   **Photo Proof:** Mandatory selfie verification for each punch.

### Module C: Leave Management
**Status:** 📝 Planned

*   **Accrual Engine:** Automated calculation of Earned Leaves based on attendance days (e.g., 1 day leave for every 20 days worked). Currently manual ("Excel Hell").
*   **Approval Workflow:**
    *   Employee requests leave -> MD gets push notification.
    *   MD approves -> Ledger updates -> Employee notified.
*   **Transparency:** Employees can see exactly *pending*, *approved*, and *rejected* requests history.

---

## 4. Technical Architecture

### The "Backend Monopoly" Pattern
To ensure integrity, the frontend acts as a "Read-Only View" with "Action Intents".
1.  **Frontend:** React 19 + Vite 7 (PWA). fast, responsive, modern.
2.  **API Gateway:** Node.js (Express) hosted on **Render**. This is the "Gatekeeper".
    *   Validates Auth Token.
    *   Checks Rate Limits.
    *   Validates Payload (Zod).
    *   Writes to Database.
3.  **Database:** Firebase Realtime Database (RTDB).
    *   Chosen for low latency (WebSockets) over SQL (Polling).
    *   When an MD approves a request, the Employee's screen checks green in ~50ms.

### Constraints & Non-Functional Requirements
1.  **Zero-Cost Infrastructure:** Must run on Firebase Spark Tier + Render Free Tier.
    *   *Implication:* Code must be efficient. No heavy compute.
2.  **Latency:** "Latency is User Experience." Interactions must feel instant.
3.  **Security:**
    *   **Zero Trust:** trust no signal from the client device (Time, Location, IP).
    *   **Fail Closed:** If Auth fails, access is denied.

---

## 5. Implementation Roadmap for PRD

1.  **Phase 1 (History):** Legacy system used direct Firebase writes. **Failed** due to lack of validation and trust issues.
2.  **Phase 2 (Current):** Migration to "Backend Monopoly".
    *   Moving logic from Frontend to Node.js (Render).
    *   Implementing strict Zod validation.
3.  **Phase 3 (Future):**
    *   **Device Binding:** Fingerprinting devices.
    *   **Payroll Integration:** Exporting "Approved" days to Excel/Payroll software.
    *   **Smart Alerts:** Notifying MD if an employee is absent for 3+ days without leave.

---

## 6. Critical Terminology for LLM
*   **"Golden Source":** The Firebase Database is the single source of truth.
*   **"Ghost Features":** Features like Device Verification that are planned but critical for the "Trust" promise.
*   **"Minister's Key":** The Service Account used by the Render Backend to write to Firebase. The Frontend **never** has write access to the critical ledger.
