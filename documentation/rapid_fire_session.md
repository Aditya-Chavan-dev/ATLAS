# Rapid Fire Q&A Session

This document records the rapid fire question and answer session between the User and the AI.

---

### Q: What are we using in full stack?

**Answer:**

*   **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, TanStack Query.
*   **Backend:** Firebase (Functions, Realtime Database), Node.js 18.

### Q: How have we implemented realtime sync throughout the app?

**Answer:**

We use **Firebase Realtime Database listeners**.

**The Analogy: The "Magic Scoreboard"**

Imagine you are watching a live sports game on a **magic scoreboard**.

1.  **Subscription (Tuning In):** You turn on the scoreboard. You are now "listening" for updates.
2.  **Initial Load (First Glance):** Immediately, you see the current score (e.g., 2-1).
3.  **Real-time Push (The Goal):** A player scores a goal. The referee updates the official record.
4.  **State Update (Instant Change):** *Instantly*, without you hitting "refresh" or asking "what's the score?", the number on your screen flips to 3-1. The data was "pushed" to you.
5.  **Cleanup (Turning Off):** When you turn off the scoreboard, you stop receiving updates.

**In our App:**
Instead of a score, we "listen" to **user status** or **attendance**. When data changes in the database (the referee), it instantly updates on your screen (the scoreboard) without you needing to reload.

### Q: Analyse the current system and tell me what is pending?

**Answer:**

**Status: The "Hollow Shell"**
We have a beautiful *standard* React app, but we are missing the **Forensic Soul** defined in the v3.2 Architecture.

**What is Missing (The Critical 40%):**

1.  **The "Trusted Offset" Protocol (Offline Integrity):**
    *   *Concept:* Using device uptime (`performance.now()`) to detect if a user changed their phone clock while offline.
    *   *Status:* **0% Implemented.** The code does not capture or verify this.

2.  **The "Singularity Rule" (Device Binding):**
    *   *Concept:* Locking a user to exactly ONE hardware device using a `validDeviceId` to prevent "Buddy Punching".
    *   *Status:* **0% Implemented.** No checks exist in the codebase.

3.  **Strict "Day Bucketing":**
    *   *Concept:* Forcing start/end times to strictly align with the IST "Business Day".
    *   *Status:* **Pending.** Logic likely relies on simple timestamps.

**Summary:** The app works for *honest* users, but it is currently wide open to *manipulation* (clock changing, buddy punching), which violates the core promise of ATLAS v3.2.

### Q: Single Source of Truth?

**Answer:**

We have **Two** distinct Truths, depending on what you are asking about:

1.  **For DATA (The "Vault"):**
    *   **Firebase Realtime Database (RTDB)** is the absolute master.
    *   It holds the permanent, immutable legal records (Attendance Logs, Users). If the app says X and RTDB says Y, **RTDB is right**.

2.  **For TIME (The "Watch"):**
    *   **The Server Clock (Google NTP)** is God.
    *   We **never** trust the user's phone clock (which can be changed). We calculate "True Time" by comparing the server clock against the device's uptime.

---

### **New Feature: Employee History**

**Description:**
A personal timeline for employees to view their own attendance records for the past 30 days.

**Why?**
Currently, employees only see "Today's Status". They need to verify if their previous days were approved or rejected (especially if they were offline).

**Implementation Strategy:**
*   **Challenge:** Database structure (`attendance/{date}/{uid}`) makes "get all for user" hard.
*   **Solution:** **Client-Side Aggregation**. The app will parallel-fetch the specific path for the user for the last 30 days (e.g., `attendance/2023-10-01/uid`, `attendance/2023-10-02/uid`...).
*   **Performance:** 30 parallel light reads is negligible for Firebase.
