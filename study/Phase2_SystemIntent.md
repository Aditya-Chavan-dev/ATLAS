# Phase 2: System Intent & Technology Theory
**Status:** ✅ Complete
**Confidence:** HIGH (Intent derived from Master Docs & Proposal architecture)

## 1. The Origin Story (Problem Statement)
ATLAS was not built to "digitize attendance". It was built to **eliminate trust**.

### The Core Problems
1.  **The "Buddy Punching" Vulnerability**: Traditional systems rely on login credentials, which can be shared. ATLAS V2 intent explicitly targets "Device Verification" (Device ID binding) to ensure physical presence.
2.  **The "Excel Hell"**: Manual aggregation of daily attendance into monthly payroll ledgers creates human error and latency.
3.  **The "Trust Gap"**: Employers do not trust self-reported times; Employees do not trust manual HR calculations.

### The System Intent
ATLAS acts as the **Incorruptible Timekeeper**.
*   **For the Company**: It guarantees that an "Approved" record implies verified presence (Time + Location + Device).
*   **For the Employee**: It guarantees transparency. If you mark attendance, you see the "Pending" status instantly. No lost applications.

---

## 2. First Principles Architecture

### 2.1 The "Backend Monopoly" Axiom
**Principle**: *The Client is Hostile.*
In many Firebase apps, the client writes directly to the DB. ATLAS **rejects** this.
*   **Reasoning**: If the client can write to `attendance/`, they can inject fake data.
*   **Solution**: We define a "Privileged Bridge" (Node.js on Render). Only this bridge holds the "Ministers Key" (Service Account) to write to the Ledger (RTDB).

### 2.2 The CAP Theorem Positioning
ATLAS prioritizes **Availability** and **Partition Tolerance** (AP) on the client, but **Consistency** (CP) on the Server.
*   **Client View**: Can open the app offline (PWA), see cached data (**Availability**).
*   **Server View**: Must have exact, atomic locks for marking attendance (**Consistency**).
*   **Resolution**: The `Mutex` lock ensures we sacrifice Availability (requests fail if locked) to guarantee Consistency (no double punch).

---

## 3. Technology Stack: First Principles Justification

Why this specific stack? It’s not random. It is an engineering response to the constraints.

### 3.1 Why Firebase Realtime Database (RTDB) over SQL?
*   **The Constraint**: Attendance is a "Stream of Events" (Check-in, Check-out).
*   **The First Principle**: **Latency is User Experience.**
    *   **SQL (Postgres)**: Request -> Query -> Result. Latency = ~200ms. Requires polling for updates.
    *   **RTDB**: WebSocket connection. Server pushes update -> Client receives in ~50ms.
    *   **Benefit**: When an MD approves a leave, the Employee sees the green tick *instantly* without refreshing. This "Liveness" builds trust in the system.

### 3.2 Why Node.js (Express)?
*   **The Constraint**: High I/O (Database reads/writes), Low CPU (Simple math).
*   **The First Principle**: **Non-Blocking Event Loop.**
    *   ATLAS is an "Event Router". It receives a request, checks Auth, talks to Firebase, and responds. It essentially waits for I/O 99% of the time.
    *   Node.js handles thousands of concurrent "waiting" connections better than threaded architectures (Java/Python) on low-resource hardware (Render Free/Starter tier).

### 3.3 Why React 19 & Vite 7? (Bleeding Edge)
*   **The Constraint**: Mobile-first performance.
*   **The First Principle**: **DOM abstractions are expensive.**
    *   React 19 (Compiler) reduces the overhead of `useMemo` and `useCallback`, optimizing the "re-render cascades" common in complex dashboards.
    *   Vite 7 uses ESBuild (Go-based) for instant server starts, keeping the "Feedback Loop" tight for developers.
    *   **Risk**: We pay the "Early Adopter Tax" (bugs, breaking changes) for this performance.

### 3.4 Why Render?
*   **The Constraint**: "Zero-Ops". We are Developers, not DevOps.
*   **The Principle**: **Immutable Infrastructure.**
    *   We push code (Git). Render bundles it into a container. We don't manage OS patches, SSH keys, or firewalls.

---

## 4. Critical Gaps Discovered

### 4.1 The Empty Foundation
**Flag**: `docs/ATLAS_FOUNDATION.md` is empty (0 bytes).
*   **Risk**: The philosophical "Constitution" of the project is lost. We are inferring intent from code, which is dangerous (Code explains *How*, not *Why*).

### 4.2 The "Ghost" Features
The `backend_v2_proposal.md` lists features that are **Not Implemented** but critical for the "Trust" promise:
1.  **Device Verification**: "Trust No One". Currently not in the codebase.
2.  **Accrual Engine**: Automated PL credits. Currently manual.
3.  **Strict Time-Window**: Prevention of back-dated attendance.

---

## 5. Summary
ATLAS is a system designed to **enforce truth** in an environment of **low trust**. It leverages Realtime sockets (Firebase) to provide instant feedback and a strict Node.js Gateway to prevent tampering. It is built on "Bleeding Edge" frontend tech (React 19) but relies on "Battle Tested" serverless backend tech (Firebase/Render).
