# Backend Feature Proposal v2: Engineering Solidity

You asked for "Solid Features" that are actually useful. Based on the code audit, here are 3 critical gaps in **Data Integrity** and **Automation** that we can solve with the Render backend.

---

## 1. "Ironclad" Geo-Verification (Trust No One)
**Current State**: The Frontend calculates distance and tells the Backend "I am at Office". The Backend trusts it blindly. (Spoofable).
**The Fix**: Move the "Truth" to the Backend.
*   **Logic**:
    1.  App sends `{ lat, lng, type: 'Office' }` payload.
    2.  Backend fetches `OFFICE_COORDINATES` (Config/DB).
    3.  Backend calculates distance (Haversine Formula).
    4.  **Rule**: If dist > 100m, **REJECT** request with 403.
*   **Value**: Impossible to fake attendance location without spoofing GPS at the OS level. Real accountability.

## 2. The Accrual Engine (Fairness Automator)
**Current State**: Leave deduction is implemented, but *Crediting* seems manual or non-existent in the backend code.
**The Fix**: Automated Monthly Credits.
*   **Logic**:
    1.  **Cron Job**: Runs on `1st of Month @ 00:01 AM`.
    2.  **Action**: Iterates all active employees.
    3.  **Updates**: `balance.pl += 1.5` (or configured rate).
    4.  **Capping**: Enforces "Max Carry Forward" rule (e.g., max 45 days).
    5.  **Audit**: Logs "System credited 1.5 PL to [User]" for transparency.
*   **Value**: Eliminates manual HR work and "forgotten" credits complaints.

## 3. Strict Time-Window Enforcement
**Current State**: `markAttendance` accepts `dateStr`. Theoretically, a user could mark attendance for *next week* or *last month* if they craft the API call.
**The Fix**: The "Timekeeper" Middleware.
*   **Logic**:
    1.  Calculate `ServerDate`.
    2.  **Rule 1 (Future)**: Reject any `dateStr > ServerDate`.
    3.  **Rule 2 (The Punctuality Window)**: Reject any `dateStr < (ServerDate - 48 hours)`.
    4.  **Exception**: Admins can override.
*   **Value**: Prevents "Ghost Attendance" (filling previous days to cover absence) and data tampering.

---

## Recommendation
Implement **Ironclad Geo-Verification** first. It closes the biggest trust gap in the system.
