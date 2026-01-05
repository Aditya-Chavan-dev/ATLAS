# ATLAS System Architecture v2 Proposal 🏗️

## 1. Core Philosophy: "Unbreakable & Trustworthy"
The goal is to build an attendance system that works anywhere (Offline-First) but trusts no one (Server-Side Validation).

## 2. Technical Stack 🛠️

| Component | Technology | Why? |
| :--- | :--- | :--- |
| **State/Cache** | **TanStack Query (v5)** | Best-in-class async state management, caching, and auto-refetching. |
| **Offline Storage** | **IndexedDB (via `idb-keyval`)** | Large storage capacity (Photos/Logs) unlike localStorage. |
| **Validation** | **Zod** | Runtime schema validation. Strong contracts between Client & DB. |
| **API Layer** | **Firebase Cloud Functions (v2)** | Moves logic off the client. Essential for security. |
| **Error Tracking** | **Sentry** | Real-world crash reporting. |

## 3. The "Offline-First" Engine 🚂

We will implement a **Sync Queue Pattern**:

1.  **Action:** User clicks "Mark Attendance".
2.  **Optimistic UI:** App immediately shows "Success" (Green Tick).
3.  **Local Commit:** Data is written to IndexedDB `action_queue`.
4.  **Sync:** Service Worker / React Query mutation tries to send to Server.
    *   **Success:** Remove from Queue. Update real data.
    *   **Failure (Offline):** Keep in Queue. Retry on `online` event.

**Edge Case Handling:**
*   **App Close:** If user closes app while offline, the Queue persists in IndexedDB. Syncs next time app opens.
*   **Conflict:** Server Timestamp always wins.

## 4. Security & Anti-Spoofing "The Fortress" 🛡️

Legacy allowed client-side timestamps. v2 will NOT.

### A. Time Manipulation Defense
*   **Vector:** Employee changes phone time to 9:00 AM when it's 10:00 AM.
*   **Solution:** Client sends `request`. Server (Cloud Function) generates the timestamp `admin.database.ServerValue.TIMESTAMP`.
*   **Result:** Impossible to fake time.

### B. GPS Spoofing Defense
*   **Vector:** Fake GPS apps or "Mock Locations".
*   **Solution (Layers):**
    1.  **Server Geography:** Cloud Function calculates `haversineDistance(userLocation, officeLocation)`. If > 100m, reject.
    2.  **Teleportation Check:** If user logged in Mumbai at 9:55 and Pune at 10:00 -> Reject (Speed > 1000km/h).
    3.  **Accuracy Audit:** Log the `accuracy` radius from the GPS API.

## 5. API Design & Reliability 🚀

### Validated Endpoints (Zod)
Everything entering the backend is validated.
```typescript
const AttendanceSchema = z.object({
  uid: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number()
  }),
  photoBase64: z.string().optional() // for verification
});
```

### Idempotency
*   **Problem:** Slow network. User taps "Check In" 5 times.
*   **Solution:** Client generates a `requestId` (UUID). Server accepts the first request with that ID and ignores the rest.

## 6. Failure & Crash Handling 🪂

*   **Global Error Boundary:** React Error Boundary wraps the execution. Catches generic interaction errors.
*   **Fallback UI:** "We couldn't load the dashboard. [Try Again]" (Logic to clear cache/reload).
*   **Sentry Integration:** Automatic reporting of JavaScript errors in production.

---
**Discussion Point:** This architecture moves strictly away from "Writing to DB from Client" for attendance. Is this acceptable?
