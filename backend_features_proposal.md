# ATLAS Backend Feature Proposal: The "Render" Advantage

Since we are now running on a **Persistent Node.js Server (Render)** instead of stateless Cloud Functions, we can implement powerful, long-running, and time-aware features that were previously difficult or expensive.

These features focus on **Automation**, **Business Intelligence**, and **Reliability**.

---

## 1. The "Auto-Pilot" Manager (Cron Automation)
*Reduce the MD's workload by making the system manage itself.*

### A. Automatic End-of-Day Closure
**Problem**: Use cases like "Forgot to Checkout" mess up payroll calculations.
**Solution**: A scheduled job runs at **11:59 PM Local Time**.
-   **Checks**: Anyone still marked "Present" but not "Checked Out".
-   **Action**: Auto-checkout at Shift End-Time (or strict 6:00 PM) OR mark as "Incomplete Shift".
-   **Alert**: Sends a summary notification to the MD: *"3 employees forgot to checkout today. System auto-corrected."*

### B. "Shift-Start" Nudges
**Problem**: Employees forget to mark attendance until 11 AM.
**Solution**: A job runs at **9:15 AM**.
-   **Checks**: Active employees who haven't marked attendance yet.
-   **Action**: Sends a gentle FCM push: *"Good morning! Don't forget to mark your attendance."*

### C. Weekly Productivity Digest
**Problem**: MD doesn't look at the dashboard every day.
**Solution**: A job runs **Every Friday at 6:00 PM**.
-   **Generates**: A PDF/Email summary.
-   **Content**: "Total Hours Worked", "Most Punctual", "Late Arrivals", "Pending Approvals".
-   **Delivery**: Email directly to `OWNER_EMAIL`.

---

## 2. Payroll & Compliance Engine
*Turn raw data into money-ready reports.*

### A. One-Click Payroll Freeze
**Feature**: "The Monthly Lock"
**Logic**:
-   Admin clicks "Prepare Payroll for [Month]".
-   Backend **Locks** all attendance records for that month (Read-Only).
-   Calculates: `(Days Present * Daily Rate) - (Unpaid Leaves) + (Overtime)`.
-   Generates a `Payroll_Preview.json` for review.
-   Prevents "History Rewriting" after payment.

### B. Leave Liability Tracker
**Feature**: "How much vacation do I owe?"
**Logic**:
-   Transactions based Leave System.
-   Accrual logic: +1.5 days added automatically on the 1st of every month.
-   Prevents negative balance unless authorized.

---

## 3. Real-Time Operational Intelligence
*Using WebSockets (Socket.io) for live command and control.*

### A. The "Live Site" Map
**Feature**: "Who is on site right now?"
**Logic**:
-   When an employee enters "Site" mode, the app sends heartbeat pings (every 5-15 mins).
-   Backend maintains a "Live Session" inventory.
-   MD Dashboard shows a map with active pins.
-   **Benefit**: Instant visibility of field force distribution.

### B. Instant "Stop-Work" Broadcast
**Feature**: Emergency Broadcast.
**Logic**:
-   MD presses a "Critical Alert" button.
-   Server keeps an open socket to all running apps.
-   Triggers a **Full Screen Red Alert** on every device instantly (latency < 100ms).
-   Use Case: Safety hazards, urgent site evacuation, or immediate announcements.

---

## 4. System Resilience & Data Sovereignty

### A. Automated "Cold Storage" Backup
**Feature**: Data Safety.
**Logic**:
-   Weekly cron job.
-   Dumps the entire Firebase JSON tree.
-   Encrypts it (AES-256).
-   Uploads it to a separate AWS S3 bucket or Google Drive.
-   **Why**: Protects against Firebase account lockouts or accidental mass-deletions.

### B. "Ghost" Device Detection
**Feature**: Security.
**Logic**:
-   Backend tracks `DeviceId` + `IP` + `LastLogin`.
-   If a single UserID logs in from > 2 devices in 24 hours -> **Flag Security Alert**.
-   If a UserID logins from a Geo-IP too far apart (physics impossible) -> **Auto-Suspend**.

---

## Implementation Roadmap (Recommended Order)

1.  **"Shift-Start" Nudges** (High Value, Low Effort).
2.  **Automatic End-of-Day Closure** (Fixes Data Quality).
3.  **Payroll Freeze** (High Business Value).
4.  **Weekly Digest** (Keeps Owner Engaged).
