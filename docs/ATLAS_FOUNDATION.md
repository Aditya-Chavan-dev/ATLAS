# ATLAS v3.2 — SYSTEM DESIGN & ARCHITECTURE (MASTER SPECIFICATION)

## 0. Document Metadata

| Property | Value | Description |
| :--- | :--- | :--- |
| **System Name** | ATLAS (Attendance Tracking & Location Assurance System) | The system identity. Note that "Location" in this context strictly refers to semantic Site Identity (e.g., "Site A"), not geospatial GPS coordinates. |
| **System Version** | 3.2.0 (Release Candidate) | This version represents the finalized architecture, superseding all previous drafts (v1.x, v2.x, v3.0, v3.1). |
| **Document Status** | 🔒 **LOCKED** (Canonical Source of Truth) | This document is the absolute authority for the system. Any deviation during implementation is formally considered a defect. |
| **Date of Issue** | January 06, 2026 | The specific date of this finalized release. |
| **Authorship** | Principal Software Architect | Authored by the Architecture Team; Approved by Security Lead and Managing Director. |
| **Intended Audience** | Implementation Engineers, QA Leads, System Auditors, Dispute Arbitrators | The technical depth is calibrated for Senior Engineering staff and Forensic Data Auditors. |
| **Change Policy** | Strict Version Control (ACR Required) | No ad-hoc changes are permitted. any modification to this specification requires a formal Architectural Change Request (ACR) and a version increment. |
| **Compliance Standard** | Audit-Grade / Forensic-Ready | The system is designed to produce records capable of withstanding scrutiny in legal or labor dispute scenarios. |

---

## 1. Executive Summary

ATLAS v3.2 is a **human-trust, correctness-first attendance verification system** designed specifically for high-stakes, low-trust field environments. Its primary mandate is to serve as the single source of truth for payroll calculation by answering one fundamental, legally binding question: *"Did Employee X legitimately work on Date Y?"*. Unlike automated surveillance systems that rely on potentially flaky GPS signals or expensive, fragile biometric hardware, ATLAS fundamentally rejects the idea of "passive tracking". Instead, it utilizes a "Proof of Claims" architecture where attendance is asserted by the user via **Cryptographic Device Binding (The "Singularity Rule")** and verified by authoritative human judgment (Managing Director Approval).

The system addresses the specific failure modes of distributed workforces—namely "Ghosting" (absent employees claiming work) and "Buddy Punching" (credential sharing). It achieves non-repudiation through a rigorous **Offline-First** design. Recognizing that field sites often have hostile network conditions, ATLAS guarantees that an employee's "intent to work" is captured instantly, cryptographically signed, and queued in a local immutable ledger. This claim is then synchronized when connectivity is restored, using a **Trusted Offset Protocol** that mathematically detects and flags any attempt to manipulate the client-side clock, ensuring that the integrity of the timestamp is preserved even in the absence of an internet connection.

Technologically, the platform provides flagship capabilities centered on **Atomic Offline Persistence** and **Forensic Auditability**. The frontend acts as a "Zero-Data-Loss" agent, persisting every keystroke and action to IndexedDB, surviving app crashes or device reboots. The backend maintains an append-only, write-once audit ledger that records every state transition—Creation, Approval, Rejection, and Device Handover—preserving the causal history of every payroll event. This creates a system where data can be appended but never destructively mutated, providing a formidable defense against disputes.

Operationally, ATLAS is tuned for **Correctness over Availability** in its write path, and **Availability over Consistency** in its read path. This means the system will aggressively reject any write request that fails a security check (e.g., a device mismatch or time fraud), protecting the integrity of the database above all else. Conversely, for reading status and dashboards, it serves cached data instantly to ensure a snappy user experience, reconciling with the server in the background. This bias ensures that while the UI is fast, the underlying record is incorruptible.

---

## 2. Problem Statement

### 2.1 The Current Workflow: "Cognitive Bottleneck"
The organization currently relies on a **Memory-Based System**. There is no automated data capture. Instead, the Managing Director (MD) mentally tracks the presence of 10–12 employees throughout the day and manually updates a master Excel sheet.
*   **The Bottleneck**: The MD acts as a human database. This imposes a significant cognitive load and turns a high-value executive into a manual data entry clerk.
*   **The Single Point of Failure**: If the MD is busy, traveling, or forgets to update the sheet, the "Truth" is lost.
*   **Scalability Limit**: While possible with 5 employees, "remembering" attendance for 12+ people across 30 rolling days is cognitively impossible to do without errors.

### 2.2 The "He Said / I Forgot" Paradox
Disputes in this system are structural, not necessarily malicious.
*   **Scenario**: An employee claims, *"Sir, I was at the site last Tuesday."*
*   **The Gap**: The MD *does not remember*.
*   **The Conflict**: Without an objective record, the MD must either:
    1.  **Trust**: Risk paying for unworked time (Financial Loss).
    2.  **Reject**: Risk demotivating an honest worker (Morale Loss).
The current Excel sheet is only as reliable as the MD's memory at the moment of data entry, which is inherently fallible.

### 2.3 The Architectural Solution: Inversion of Control
ATLAS solves this by **inverting the responsibility**:
*   *Old Way*: MD observes -> MD Remembers -> MD Types.
*   *New Way (ATLAS)*: Employee Claims (via Device) -> MD Verifies.
This shifts the "Data Entry" burden to the edge (the Employee), leaving only the "Governance" burden (Approval) to the MD. The system transforms "Memory" into "Evidence."

---

## 3. Explicit Non-Goals (Hard Constraints)

To prevent scope creep and maintain system integrity, the following features are **PERMANENTLY EXCLUDED** from the architecture. These are not "missing features"; they are deliberate architectural rejections.

| Excluded Feature | Rationale for Exclusion | Consequence of Violation |
| :--- | :--- | :--- |
| **GPS Tracking / Geofencing** | **Privacy & Reliability**: GPS signals are structurally unreliable in the "concrete canyons" of construction sites and basements. Continuous tracking drains battery and violates modern privacy norms (GDPR/DPDP). | High false-negative rate leads to employee frustration ("I am here, but it says I'm not"). This friction causes users to abandon the app and return to verbal claims, defeating the purpose of the system. |
| **Productivity Monitoring** | **Ethical Alignment**: ATLAS tracks *Presence* (Attendance), not *Activity* (Productivity). "Screen-time" or "Keystroke" metrics encourage "busy work" theatre and damage the trust relationship between MD and Staff. | Shifts culture from "Outcome-based" to "Activity-based" (Toxic). |
| **Automated Rejections** | **Authority Model**: Software lacks context. A computer cannot know if "Lateness" was verbally authorized by the MD yesterday. Only the MD has the authority to reject a signed claim. | "Computer Says No" moments erode the MD's authority and dehumanize the workforce. |
| **Web Browser Support** | **Security**: Standard web browsers lack persistent, uncloneable Hardware identifiers. Cookies and LocalStorage can be cloned or cleared, breaking the "Singularity Rule". | Opens the system to "Scripting" attacks and Credential Sharing, making "Buddy Punching" trivial again. |
| **Payroll Calculation** | **Scope Purity**: ATLAS provides the *Inputs* (Verified Days Worked). The Accounting Software (Tally/QuickBooks) handles the *Outputs* (Taxes/Salary). Merging them creates unnecessary complexity. | Scope creep; Duplication of complex tax logic; Maintenance nightmare. |

---

## 4. Domain Invariants (The "Laws of Physics")

These are the absolute, non-negotiable rules that the software must enforce. If any of these rules are broken, the system is considered "Compromised".

### 4.1 The Singularity Law
> *An identity (User UID) can be active on exactly **ONE** `validDeviceId` at any moment.*

*   **Definition**: It is mathematically impossible for User A to have valid sessions on Device 1 and Device 2 simultaneously. A user cannot clone themselves.
*   **Enforcement**:
    *   **DB**: The `users/{uid}` document contains a `validDeviceId` field.
    *   **API**: Every write request must include an `x-device-id` header. The API Middleware executes a strict equality check: `req.header.deviceId === db.users[uid].validDeviceId`.
    *   **Handover**: Registering a new device (Device 2) automatically overwrites the `validDeviceId` field. This action instantly and irrevocably "bricks" the old device (Device 1) for that user.
*   **Failure Analysis**: If this invariant fails, "Buddy Punching" becomes possible. Therefore, this check happens *before* any business logic.

### 4.2 The Immutable Past Law
> *Once a calendar day is closed (Approved/Rejected), the factual history of 'What happened' cannot be altered.*

*   **Definition**: The `markedAt` timestamp, `deviceId`, and `siteId` of a record are factual claims. They represent physical reality at a moment in time. They can never be edited or deleted.
*   **Enforcement**: Firestore Security Rules strictly forbid `update` or `delete` operations on the `timeline` map of an existing document. Only the `status` field (which represents a human *opinion* on the facts) can be updated by the MD.
*   **Failure Analysis**: If this invariant fails, trust in the audit trail is destroyed.

### 4.3 The Conservation of Time Law
> *A user cannot mark attendance for a future point in time.*

*   **Definition**: Attendance is a claim of *current* or *past* presence. Claims about the future are invalid.
*   **Enforcement**: Logic Layer strictly rejects any payload where `payload.timestamp > server.now() + 5 minutes` (allowing for minor localized clock skew). Future dates are rejected with `400 Bad Request`.

---

## 5. Time & Date Authority Model

Time is the most critical dimension in an attendance system. In a distributed environment where devices can be offline and user clocks can be manipulated, the system must establish a "Single Source of Time Truth."

### 5.1 The Authority Hierarchy
We implement a strictly hierarchical trust model for time:
1.  **Level 0 (Absolute Truth)**: The Server Clock (Google Cloud Functions NTP Time). This source is monotonic and cannot be altered by any user.
2.  **Level 1 (Trusted Estimate)**: The "Calculated True Time" (Derived from Client Uptime). This is mathematically inferred and trustworthy within a small margin of error.
3.  **Level 2 (Untrusted Hint)**: The Client Wall Clock (User's System Time). This is treated as "suspect" and used only for UI display, never for business logic.

### 5.2 The "Trusted Offset" Algorithm (Offline Drift Correction)
A core challenge is: *How do we trust a timestamp generated while the device was offline?* A malicious user could change their phone date to yesterday, mark attendance, and change it back.
ATLAS solves this using the **Trusted Offset Protocol**, which relies on the fact that `performance.now()` (Device Uptime) is monotonic and harder to spoof than the system date.

**The Algorithm:**
1.  **Capture (Offline Action)**:
    *   User clicks "Mark Attendance".
    *   App captures two values:
        *   `claimedTime` (e.g., `Jan 6, 10:00 AM` - from System Clock).
        *   `uptimeMark` (e.g., `500,000ms` - from `performance.now()`).
2.  **Transmission (Online Sync)**:
    *   When connectivity restores, the App packs the payload.
    *   App appends `uptimeSync` (e.g., `505,000ms` - current `performance.now()` at the moment of sync).
3.  **Verification (Server-Side)**:
    *   Server receives the packet and captures `serverTimeNow` (e.g., `Jan 6, 12:05 PM`).
    *   Server calculates the time elapsed on the device between the *Act* and the *Sync*: `elapsed = uptimeSync - uptimeMark` (e.g., `5,000ms`).
    *   Server subtracts this elapsed time from its own authoritative clock: `trueMarkTime = serverTimeNow - elapsed`.
4.  **Drift Detection**:
    *   Server compares `trueMarkTime` vs `claimedTime`.
    *   If `drift > 15 minutes`: The record is saved but flagged with `integrity: "SUSPICIOUS_TIMING"`.
    *   If `drift <= 15 minutes`: The record is marked `integrity: "TRUSTED"`.

### 5.3 Date Bucketing (The "Business Day")
All timestamps are normalized to a specific Time-Zone for reporting.
*   **Time Zone**: **IST (Indian Standard Time, UTC+05:30)**.
*   **Day Boundary**: A "Day" is defined from `00:00:00 IST` to `23:59:59 IST`.
*   **Edge Case Strategy**: If a worker checks in at `23:55` and checks out at `00:05`, it is recorded as two separate events belonging to two different "Business Days" unless explicitly linked by a "Shift" logic (which is currently a Non-Goal). For ATLAS v3.2, strict Date Bucketing is applied.

---

## 6. Consistency Model

ATLAS adopts a **Split Consistency Model**, prioritizing correctness for writes and responsiveness for reads.

### 6.1 Source of Truth
*   **The Ledger (Firestore)**: Use for `attendance`, `users`, and `audit_logs`. This is the System of Record (SoR).
*   **The Session (Realtime DB)**: Use for ephemeral `presence` (Online/Offline status). This is transient and disposable.

### 6.2 Write Path: Strong Consistency (ACID)
All state-mutating operations (**Marking Attendance**, **Approving Claims**, **Device Handover**) strictly execute within **Firestore Transactions**.
*   **Why?** To enforce the "Singularity Law" and "Conservation of Time".
*   **Mechanism**: A "Read-Modify-Write" loop.
    1.  `Read` the user's current status and device ID.
    2.  `Verify` constraints (Is already marked? Is device valid?).
    3.  `Write` the new record.
*   **Guarantee**: If two concurrent requests try to update the same record (e.g., specific race conditions), the database will reject one. We do **not** use "Last Write Wins" for core business data.

### 6.3 Read Path: Eventual Consistency (Snapshot)
The Client UI subscribes to data via **Real-time Listeners** (`onSnapshot`).
*   **Latency**: Changes on the server typically propagate to clients within milliseconds to seconds (network dependent).
*   **Stale Reads**: If the device is offline, it reads the last known state from `IndexedDB`. The UI explicitly indicates this staling via a "Last Synced: X mins ago" badge.
*   **Resolution Strategy**: **"Server Wins"**.
    *   If the Local Cache says "Pending" but the Server Snapshot says "Rejected", the UI **immediately** updates to "Rejected".
    *   We trust the Server's state above all local heuristics.

### 6.4 Optimistic UI & Rollback
To ensure the app feels "native-fast":
1.  **Action**: User clicks "Mark".
2.  **Optimism**: UI immediately transitions to "Marked (Pending Sync)" state and updates the local list.
3.  **Reality**: The network request is queued.
4.  **Confirmation**:
    *   *Success*: The "Pending" badge turns green ["Synced"].
    *   *Failure* (Business Rule): The UI reverts the change and shows a persistent Error Toast ("Marking Failed: You already marked today").
    *   *Failure* (Network): The UI maintains "Pending" and retries silently.

---

## 7. Architectural Style

We define the architecture as an **Event-Driven Serverless Monolith** with **Command-Query Responsibility Segregation (CQRS-Lite)**.

### 7.1 The "Serverless Monolith"
All Domain Logic resides in a single logical Function App (managed by Firebase Cloud Functions), sharing a common `src/` directory and `tsconfig.json`.
*   **Why Monolith?**:
    *   **Atomic Deployments**: No "Service A is v1, Service B is v2" version mismatch hell.
    *   **Shared Types**: The exact same TypeScript interface definition is used for the API Client (Frontend), the API Controller (Backend), and the Database Schema (Firestore). This guarantees end-to-end type safety.
    *   **Simplicity**: For a team of 1-2 maintainers, Microservices are an anti-pattern that adds latency and Devops overhead without delivering value.
*   **Why Serverless?**:
    *   **Zero-Ops**: No EC2 instances to patch. No Nginx config to tune.
    *   **Scale-to-Zero**: Costs $0.00 on weekends/holidays when no one is working.

### 7.2 CQRS-Lite (Command vs Query)
We explicitly separate the "Write Model" from the "Read Model".
*   **The Command Side (Strict)**: All Writes go through explicit HTTPS Endpoint "Commands" (e.g., `POST /markAttendance`).
    *   *Characteristic*: Synchronous, heavily validated, business-logic rich.
    *   *Constraint*: The Client creates an Intent, the Server creates the Record.
*   **The Query Side (Fast)**: All Reads bypass the Logic Layer and consume directly from the Firestore "Read Model" (Snapshots).
    *   *Characteristic*: Real-time, cached, logic-free.
    *   *Constraint*: The Frontend treats the DB as a "Read-Only Replica".

### 7.3 Event-Driven Side Effects
To keep the Core Logic fast, we offload non-critical work to Async Workers.
*   *Synchorous Path*: Receive Request -> Validate -> Save to DB -> Respond 200 OK. (Latency < 500ms).
*   *Asynchronous Path*: Database emits `onCreate` event -> Trigger Cloud Function -> Send Push Notification / Update Monthly Stats / Export to Excel. (Latency: 1s - 1min).
This ensures that if the "Email Service" is down, the User still successfully checks in.
