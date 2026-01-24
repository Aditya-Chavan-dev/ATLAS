# ATLAS Product Requirements Document (Master)

> **Status:** DRAFT (v1.0)  
> **Classification:** INTERNAL  
> **Last Updated:** 2026-01-22

---

## 0. PRD IDENTITY, GOVERNANCE & AUTHORITY MODEL

*   **PRD Title:** ATLAS: The Incorruptible Timekeeper System
*   **Product Name:** ATLAS (Attendance Tracking & Leave Application System)
*   **Codename:** Project Iron Dome
*   **Version:** 1.0 (Draft)
*   **Author(s):** System Architect (Agentic AI)
*   **PRD Owner:** [Project Owner Name]
*   **Source of Truth:** This document is the single source of truth for all requirements. In code-vs-doc conflicts, code is the "current reality" but this doc is the "intent".

---

## 1. EXECUTIVE SUMMARY

**Product Definition:** ATLAS is a zero-trust, offline-first attendance and leave management system designed to eliminate the need for trust between employer and employee by enforcing a "Backend Monopoly" on all data mutations.

**Core Problem:** Traditional systems rely on client-side trust (GPS, phone time) which are easily spoofed ("Buddy Punching", "Time Fraud"). Manual Excel aggregation causes latency and errors ("Excel Hell").

**Target Users:** Small to Medium Enterprises (SME) where physical presence is mandatory and trust is low.

**Value Proposition:** "Immutable Attendance". Employers get a ledger they can trust 100%. Employees get instant transparency on their status.

**Success Metrics (KPIs):**
1.  **Zero Trust Failures:** 0 instances of successful spoofing (time/location).
2.  **Latency:** Attendance "Approved" feedback < 200ms.
3.  **Availability:** 100% capabilty to mark attendance offline.

**Non-Goals:**
*   Payroll Processing (We export *to* payroll, we don't *do* payroll).
*   Desktop/Web Dashboard for Employees (Mobile-first PWA focus).

---

## 2. CONTEXT & BACKGROUND

*   **Business Context:** The organization suffers from "Buddy Punching" and "Trust Deficit". Current manual processes lead to payroll disputes.
*   **Prior Systems:**
    *   *Manual*: Excel sheets (prone to error).
    *   *Legacy V1*: Firebase Client-side writes (vulnerable to injection attacks).
*   **Lessons Learned:** "The Client is Hostile." Never trust data from the frontend.
*   **External Pressures:** No budget for enterprise SaaS (Workday/Darwinbox). Must run on Free Tier infrastructure.

---

## 3. PROBLEM DEFINITION

*   **AS-IS Workflow:** Employee messages HR -> HR updates Excel -> HR forgets -> Employee claims they came -> Dispute.
*   **Pain Points:**
    *   *Owner:* "Are they actually here?"
    *   *Employee:* "Did my leave get approved?"
    *   *HR:* "I spent 3 days merging Excel sheets."
*   **Root Cause:** Lack of a single, immutable, real-time shared ledger.
*   **Cost of Inaction:** Estimated 10-15% payroll leakage due to time fraud and manual errors.

---

## 4. GOALS, NON-GOALS & SUCCESS METRICS

**Goals:**
*   **Business:** Reduce payroll leakage; Eliminate attendance disputes.
*   **User:** < 2 clicks to mark attendance.
*   **Technical:** 100% Offline availability; < 100ms sync latency.

**Non-Goals:**
*   Geofencing (GPS is privacy-invasive and spoofable).
*   Complex Biometrics (Hardware costs too high).

**Success Metrics:**
*   **Trust:** 100% of "Approved" records match physical reality (verified by video/random check).
*   **Adoption:** 100% of employees using the app daily.

---

## 5. CONSTRAINTS & HARD LIMITS

*   **Budget:** **Zero Cost**. Must run on Firebase Spark + Render Free Tier.
*   **Timeline:** Phase 2 Completion by [Date].
*   **Tech Stack:** React 19 (Frontend), Node.js (Render), Firebase RTDB (Database).
*   **Infrastructure:** No SQL databases (cost constraint). No persistent server storage (Render rules).

---

## 6. STAKEHOLDERS & USER PERSONAS

### Internal
*   **The Owner (Power User):**
    *   *Goal:* Total control.
    *   *Pain:* "I don't know who is in the office."
    *   *Authority:* Absolute override.
*   **The MD (Approver):**
    *   *Goal:* Manage roster.
    *   *Pain:* Constant WhatsApp leave requests.
*   **The Employee (Daily User):**
    *   *Goal:* Mark attendance and leave.
    *   *Pain:* "The app is slow/didn't save my punch."

---

## 7. USER JOURNEYS

### Journey A: Marking Attendance (Happy Path)
1.  Employee opens app (Offline/Online).
2.  Clicks "Mark Attendance".
3.  Takes Selfie.
4.  App saves to IndexedDB (Status: Pending).
5.  Optimistic UI shows "Success".
6.  Background Sync pushes to Render.
7.  Render validates & updates Firebase.
8.  UI updates to "Verified".

### Journey B: Leave Approval
1.  Employee requests leave (Dates + Reason).
2.  MD receives Push Notification.
3.  MD opens app -> Clicks "Approve".
4.  Employee receives Push Notification ("Approved").

---

## 8. UX, USABILITY & PRODUCT EXPERIENCE

*   **Latency Rules:** "Liveness" is critical. Use Optimistic UI for all user actions. Never show a spinner for > 100ms if possible.
*   **Error Philosophy:** "Fail Loudly." If auth fails, show a clean "Access Denied" screen. DO NOT fail silently.
*   **Visuals:** Premium Glassmorphism. Dark Mode default.

---

## 9. ACCESSIBILITY & INCLUSIVITY

*   **Target:** Usable by non-native English speakers (Clear icons, simple text).
*   **Contrast:** High contrast text for outdoor usage (sunlight visibility).

---

## 10. FUNCTIONAL REQUIREMENTS

### FR-01: Identity Management
*   **Trigger:** User login via Google OAuth.
*   **Check:** Email MUST be in Firestore `whitelist`.
*   **Failure:** If email unknown -> Auto-Ban/Logout.
*   **Priority:** MUST.

### FR-02: Attendance Marking
*   **Input:** Selfie Image (Base64).
*   **Process:** Client sends intent. Server stamps `ServerTime`.
*   **Output:** New record in `attendance/YYYY-MM/DD/{uid}`.
*   **Invariant:** 1 Record per user per day (handled by Mutex).
*   **Priority:** MUST.

### FR-03: Leave Management
*   **Input:** Start Date, End Date, Type (Sick/Casual).
*   **Validation:** Balance check (optional in v1).
*   **Priority:** SHOULD.

### FR-04: Master Export
*   **Trigger:** Admin clicks "Export Excel".
*   **Output:** .xlsx file formatted per `EXCEL_FORMAT_SPEC.md`.
*   **Priority:** MUST.

---

## 11. BUSINESS RULES & POLICIES

*   **The "Server Time" Law:** Client timestamps are ignored. Only Server Time (`new Date()` on Render) is legal tender.
*   **The "One Punch" Rule:** A user can only mark "IN" once per day. Subsequent attempts are blocked or logged as updates (configurable).
*   **Sundays:** Auto-marked as "Holiday".

---

## 12. DATA & INFORMATION ARCHITECTURE

*   **Database:** Firebase Realtime Database (Tree Structure).
*   **Paths:**
    *   `attendance/{YYYY-MM}/{DD}/{uid}`: Daily records.
    *   `users/{uid}`: Profile & Roles.
    *   `leaves/{uid}/{leaveId}`: Leave applications.
*   **Immutability:** Attendance records are append-only for Employees. Only Owner can mutate.

---

## 13. PRIVACY & DATA PROTECTION

*   **Selfies:** Stored in Firebase Storage (or Base64 in DB for free tier limits, TBD).
*   **Visibility:** Employees see ONLY their data. MDs see their subordinates. Owner sees all.
*   **Data Minimization:** We do not track GPS coordinates.

---

## 14. NON-FUNCTIONAL REQUIREMENTS

*   **Performance:** App load < 2s on 4G.
*   **Security:**
    *   All API endpoints validated with Zod.
    *   Token Versioning implemented for instant revocation.
*   **Resilience:** System must handle "Orphaned Locks" (Mutex timeout 5s).

---

## 15. EDGE CASES

*   **Network Failure mid-sync:** Retry with exponential backoff.
*   **Clock Skew:** User changes phone time -> Irrelevant (Server Time used).
*   **Midnight Crossing:** User punches at 11:59 PM -> Counts for today. 12:01 AM -> Tomorrow.

---

## 16. OBSERVABILITY

*   **Logs:** All critical events (Auth, Punch, Approve) logged to `audit_logs` in RTDB.
*   **Alerts:** "Zombie Admin" detection (Auth token valid but user disabled in DB).

---

## 17. TESTING STRATEGY

*   **Unit:** Jest/Vitest for Utils (Date logic, Mutex).
*   **E2E:** Manual "Field Test" (Go to basement, mark attendance, come up).

---

## 18. DEPLOYMENT

*   **Frontend:** Firebase Hosting (`firebase deploy`).
*   **Backend:** Render (Git Push to `main`).
*   **Rollback:** Git Revert.

---

## 19. DOCUMENTATION

*   **Dev:** `DEVELOPMENT_RULES.md`, `SYSTEM_ARCHITECTURE_v2.md`.
*   **User:** [Planned] "How to use ATLAS" video.

---

## 20. SUPPORT

*   **Model:** Direct contact with Developer.
*   **SLA:** Critical (Login down) < 4 hours. Non-critical < 48 hours.

---

## 21. DEPENDENCIES

*   **Firebase:** Auth, DB, Hosting.
*   **Render:** Backend compute.
*   **Risk:** Render Free Tier "Spin Down" (30s cold start).

---

## 22. FEATURE LIFECYCLE

*   **Introduction:** Features deployed to `staging` (localhost) -> `prod`.
*   **Deprecation:** Legacy V1 features (Client writes) are strictly banned.

---

## 23. RISKS & ASSUMPTIONS

*   **Risk:** Render Free Tier limits (bandwidth/hours).
*   **Assumption:** Organization has < 50 employees (Free tier limits).

---

## 24. OPEN QUESTIONS

*   **Device Binding:** Exactly how do we fingerprint devices without native app code? (Browser Fingerprinting accuracy?).
*   **Photo Storage:** Will Base64 storage bloat RTDB constraints? (Need to monitor).

---
**FINAL VERDICT:** This document acts as the constitution for ATLAS. Any feature not listed here is unauthorized scope creep.
