# Production Readiness - Solved Issues Log

## 1. Critical Logic Gap: Leave-Attendance Overlap Check

### 🔴 The Issue (Simple)
The system was checking the wrong "file cabinet" to see if you had already marked attendance. It was looking at a global folder that was empty, so it always thought "No attendance marked here, you're good to apply for leave!". This meant you could be marked "Present" and also be on "Leave" for the same day.

### ⚙️ The Fix (Technical)
**Problem**: `checkAttendanceOverlap` in `leaveController.js` queried `db.ref('attendance')`. This root node is unused in the current schema (legacy artifact).
**Solution**: Updated the query to target `db.ref('employees/${employeeId}/attendance')`, which is the actual Single Source of Truth for attendance records.

---

## 2. Race Condition: Double-Deduction on Approval

### 🔴 The Issue (Simple)
If two Managers clicked "Approve" on your leave request at the exact same exact moment, the system would let both of them through. It would deduct your leave balance twice (e.g., taking 2 days instead of 1) because it didn't "lock" the request while the first manager was processing it.

### ⚙️ The Fix (Technical)
**Problem**: The API performed a "Check Status" -> "Deduct Balance" -> "Update Status" flow. Concurrent requests could both pass the "Check Status" phase before either updated it.
**Solution**: Implemented a **State Locking Mechanism**.
1. First, we attempt to transition the leave status from `pending` to `processing` using a Firebase Transaction.
2. Only the request that successfully performs this transition is allowed to proceed to Balance Deduction.
3. The second request fails immediately because the status is no longer `pending`.

---

## 3. System Fragility: Notification Crashes

### 🔴 The Issue (Simple)
If the Notification Service (the thing that sends messages to your phone) was down or having a glitch, the entire "Mark Attendance" or "Approve Leave" action would fail. The application would tell you "Error", even though your attendance *was* actually saved safely. This caused confusion and made people try again unnecessarily.

### ⚙️ The Fix (Technical)
**Problem**: `await sendPushNotification(...)` was called without error handling in the main request flow. A rejection there bubbled up and caused a 500 Internal Server Error.
**Solution**: Wrapped all notification calls in `try/catch` blocks. If notifications fail, the error is logged, but the API returns `200 OK` (potentially with a warning field), preserving the integrity of the primary business action.

---

## 4. Data Safety: Offline Mode

### 🔴 The Issue (Simple)
If you were marking attendance at a site with bad internet and closed the app before it synced, your data was lost forever. The app didn't "output to disk" locally, it only kept it in temporary memory.

### ⚙️ The Fix (Technical)
**Problem**: The Firebase Web SDK for Realtime Database does not support persistent offline storage (unlike Firestore), so data was memory-only.
**Solution**: Implemented **Background Sync** via the Service Worker (`sw.js`).
- We configured `workbox-background-sync` to intercept failed attendance requests (`POST /api/attendance/mark`).
- If the network fails, the request is saved to a persistent queue (IndexedDB).
- The Service Worker automatically replays the request once connectivity is restored, ensuring the attendance is eventually marked even if the user closes the app.
