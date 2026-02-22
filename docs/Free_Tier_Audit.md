# ATLAS Free Tier Audit & Resource Budget (v2.0)

This document analyzes the scalability of ATLAS v2.0 within the Firebase **Spark (Free)** Plan for a team of 1–25 employees (with potential up to 5,000).

## 1. Firebase Limits vs. Actual Usage

| Resource | Free Tier Limit | Estimated Usage (25 Users) | Estimated Usage (5k Users) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Firestore Reads** | 50,000 / day | ~500 / day | ~50,000 / day | ⚠️ Warning |
| **Firestore Writes** | 20,000 / day | ~100 / day | ~10,000 / day | ✅ Safe |
| **Firestore Storage** | 1 GiB total | ~10 MiB / year | ~1 GiB / year | ⚠️ Warning |
| **Cloud Functions** | N/A (Blaze Req) | 100% Client-side | 100% Client-side | ❌ Removed |
| **FCM (Push)** | Unlimited | N/A (Functions Req) | N/A (Functions Req) | ⚠️ In-App / Browser* |
| **Hosting Storage** | 10 GiB total | < 100 MiB | < 100 MiB | ✅ Safe |

*\*Note: Without Cloud Functions, Push Notifications must be triggered via client-side messaging or a free-tier compatible notification proxy (e.g., Novu free tier or similar), or rely on real-time sync when the app is open.*

## 2. Optimization Strategies

### A. Firestore Write Consolidation
- **Leave Reversal**: Perform as a single atomic batch (Update Leave App Status + Restore Balance + Log Transaction).
- **Auto-Absent**: Since we lack Cloud Functions (Cron), the MD's first login of the day will trigger a client-side "Sanity Check" to mark absences for the previous day.

### B. Read Optimization (The 50k Limit)
- **Snapshot Usage**: Dashboards will use `onSnapshot` with strict queries to only listen to "Today's" data.
- **Local Persistence**: Firestore Persistence enabled to serve "Calendar History" from cache rather than re-reading the whole collection every time.

### C. Concurrent Session Management
- We use a "Heartbeat" or "DeviceID Check" in the `users` collection. On login, the user writes their `currentDeviceId`. Before any sensitive operation, we check if the local `deviceId` matches the remote one.

## 3. Scalability Verdict
ATLAS v2.0 is **highly feasible** for 25–100 users. For 5,000 users, RTDB-based optimizations (like the connection cycling mentioned in v1.0) or migrating to Firestore with strict caching is mandatory. The **Leave System** adds negligible overhead (~3 documents per application).
