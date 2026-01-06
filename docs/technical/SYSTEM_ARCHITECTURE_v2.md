# ATLAS System Architecture (v2 Lite) 🏗️

## 1. Core Constraints
*   **Infrastructure:** **Zero Cost** (Firebase Spark + Render Free Tier).
*   **Location:** **No GPS Usage**.
*   **Reliability:** **Offline-First**.

## 2. Technical Stack 🛠️

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Client Engine** | **TanStack Query (v5)** | Manages caching, optimistic UI, and background retry. |
| **Offline Storage** | **IndexedDB** | Stores photos and logs when offline. |
| **Backend API** | **Render (Node.js)** | validating middleware (Free Tier). Replaces Cloud Functions. |
| **Database** | **Firebase RTDB** | Real-time data storage. |
| **Anti-Spoofing** | **Server Time + Photo** | Trust server clock, verify employee face. |

## 3. The Flow: "Offline-First" 🚂

1.  **Action:** User clicks "Mark Attendance".
2.  **Optimistic UI:** UI shows "Success" instantly.
3.  **Local Commit:** Data saved to IndexedDB.
4.  **Sync:** Service Worker / Mutation tries to call **Render API**.
    *   **Success:** Render writes to Firebase. Client marks sync done.
    *   **Offline:** Queue persists. Retries when online.

## 4. Security & Validation (The "Iron Dome" on Render) 🛡️

Since we removed GPS, we rely on **Time** and **Identity**.

### A. Time Integrity
*   **Rule:** Client sends `request` (empty timestamp).
*   **Validation:** Render Backend stamps the **Server Time** (`new Date()`).
*   **Benefit:** Users cannot change their phone time to fake attendance.

### B. Request Validation (Zod)
Everything hitting the Render API is validated.
```typescript
const AttendanceSchema = z.object({
  uid: z.string(),
  photoBase64: z.string().min(1, "Photo required"), // Visual Proof
  deviceId: z.string() // Device Binding (Optional)
});
```

### C. Rate Limiting
*   **Middleware:** `express-rate-limit`.
*   **Rule:** Max 1 request per minute per user. Prevents double-taps.

## 5. Visual Architecture (ASCII) 📝

```text
+-----------------------+           +-----------------------------+
|   CLIENT (Mobile)     |           |  RENDER BACKEND (Free)      |
|                       |           |                             |
|  [ Mark Attendance ]  |   HTTPS   |  [ Express Middleware ]     |
|          |            | --------> |            |                |
|  [ Optimistic UI ]    |           |    1. Verify Token (Auth)   |
|          |            |           |            |                |
|  [ TanStack Query ]   |           |    2. Rate Limit            |
|    |           ^      |           |            |                |
|    v           |      |           |    3. Validate (Zod)        |
| [IndexedDB] [Sync]    |           |            |                |
+-----------------------+           |    4. Write to Firebase     |
                                    |            |                |
                                    |    [ Firebase RTDB ]        |
                                    +-----------------------------+
```

## 6. Implementation Strategy
1.  **Client:** Setup TanStack Query + Zod.
2.  **Backend:** Update Render `server.js` with new `markAttendance` endpoint.
3.  **Sync:** Implement Offline Queue on Client.
