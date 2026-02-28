# Technical Debt Audit Report

**Project:** ATLAS (Attendance Tracking and Logging Automation System)
**Date:** 2026-02-22
**Files Scanned:** 6
**Total Issues Found:** 6
**High Priority:** 2 | **Medium Priority:** 2 | **Low Priority:** 2

---

## 🔴 High Priority

### [PRIORITY: HIGH] — Security: Single Session Enforcement (Logical Race Condition)

**File:** `Architecture_spec.md` (Line 91-94)

**Issue:** The session hijacking prevention is largely client-side (`local.deviceId == remote.deviceId`). This allows a race condition where a malicious actor can perform operations before the client-side check triggers or redirects.

**Why it matters:** Violates the "Zero-Trust" principle and leaves a window for session theft.

**Suggested fix:** Enforce device ID matching directly in Firestore Security Rules.

**Code example:**
// Before
allow write: if request.auth != null;

// After
allow write: if request.auth != null && 
             request.auth.token.deviceId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.currentDeviceId;

**Effort estimate:** 1 hour

---

### [PRIORITY: HIGH] — Security & Resilience: Push Notification Logic Gap

**File:** `docs/Free_Tier_Audit.md` (Line 13, 16)

**Issue:** The plan to skip Cloud Functions for cost-saving means critical notifications (Resubmission alerts, MD Edits) rely on client-side messaging which is unreliable and easily blocked by browsers.

**Why it matters:** Core feature "Resubmission within window" breaks if notifications fail, leading to invalid "Absent" marks.

**Suggested fix:** Implement a heartbeat system using RTDB or a free-tier notification proxy (like Novu) to ensure delivery without Blaze functions.

**Code example:**
// Before
// (Missing server-side trigger)

// After
// Using RTDB as a signaling channel
match /notifications/{userId} {
  allow write: if isMD(); // MD writes to trigger a listener in Employee's SW
}

**Effort estimate:** half a day

---

## 🟡 Medium Priority

### [PRIORITY: MEDIUM] — Performance: Overfetching for Dashboards

**File:** `docs/Free_Tier_Audit.md` (Line 25)

**Issue:** The plan to fetch all "Today's data" will hit the 50k read limit rapidly if the user count approaches the 5k threshold, as every MD reload re-fetches the entire daily list.

**Why it matters:** Financial risk (Spark plan limit) and UI lag.

**Suggested fix:** Implement pagination and strict "status == 'pending'" indexing for the main landing view.

**Code example:**
// Before
db.collection('attendance').where('date', '==', today).onSnapshot(...)

// After
db.collection('attendance')
  .where('date', '==', today)
  .where('status', '==', 'pending')
  .limit(20)
  .onSnapshot(...)

**Effort estimate:** 1 hour

---

### [PRIORITY: MEDIUM] — Reliability: Auto-Absent "Sanity Check" Debt

**File:** `docs/Free_Tier_Audit.md` (Line 22)

**Issue:** Dependency on "MD's first login" to mark absences for the previous day is fragile. If the MD doesn't login (e.g., weekend/illness), the system remains out of sync.

**Why it matters:** Inaccurate reports and audit lag.

**Suggested fix:** Decentralize the sanity check to run on *any* authorized user's first interaction of the day, with a "lock" to prevent multiple threads.

**Code example:**
// Before
if (isMD && lastCheckDate != today) runSanityCheck();

// After
if (isAuthenticated && systemLock.isExpired()) runSanityCheck();

**Effort estimate:** 2 hours

---

## 🟢 Low Priority

### [PRIORITY: LOW] — Maintainability: Hardcoded Error Codes

**File:** `ATLAS_PRD_v1.md` (Line 92-101)

**Issue:** Rejection reasons are predefined in prose but will likely be implemented as hardcoded strings in components.

**Why it matters:** Manual updates to reasoning logic across multiple files leads to drift.

**Suggested fix:** Extract into a shared `rejectionReasons` constant in the `packages/shared` package.

**Code example:**
// Before
// <option>Wrong Site Selected</option>

// After
// import { REJECTION_REASONS } from '@atlas/shared';
// <option>{REJECTION_REASONS.WRONG_SITE}</option>

**Effort estimate:** 30 mins

---

### [PRIORITY: LOW] — UX: Inconsistent Loading/Empty States

**File:** `ATLAS_PRD_v1.md` (Section 10)

**Issue:** PRD describes dashboards focus on data but fails to define "Zero State" (no entries yet).

**Why it matters:** Confuses users and gives a "broken" impression on fresh installs.

**Suggested fix:** Design and implement "Empty State" components for all major lists.

**Code example:**
// Before
{list.map(item => <Item />)}

// After
{list.length > 0 ? list.map(item => <Item />) : <EmptyState message="All caught up!" />}

**Effort estimate:** 1 hour

---

## Summary
The ATLAS codebase (as defined in specs) is architecturally sound for the 25-user target but has a **critical security flaw** in how sessions are enforced. The most significant risk is the **read-limit exhaustion** if scaled to 5,000 users without strict pagination. Recommend tackling the **Rules-based Session Enforcement** immediately during Phase 2 setup to ensure a Zero-Trust foundation.
