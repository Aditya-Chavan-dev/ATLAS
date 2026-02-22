# ATLAS — Attendance Tracking and Logging Automation System
**Product Requirements Document (PRD)**
**Owner:** Chavan, Aditya G.
**Version:** 2.0 (Final)
**Last Updated:** Feb 21, 2026
**Status:** Final

---

## 1. Product Summary

**Objective**

A clean, lightweight, fool-proof system where employees mark "Present" once per day with Office or Site selection, the MD alone approves it, and both are notified in real time — backed by full auditability, a leave management system, and minimal manual effort.

**Scope (v1)**

- Employee daily attendance submission (Present only) with Office or Site selection from an MD-managed list.
- MD-only approval workflow with individual and bulk approval.
- Real-time in-app and push notifications for both MD and employee.
- Full PWA: installable app, offline shell, push notifications, real-time sync, background sync.
- Daily lock and Absent logic; MD can edit approved entries and convert Absent to Present within a configurable backdating window.
- Two roles only: Employee and MD. MD also participates in attendance as an employee (with auto-approval on submission).
- Leave Management System: Earned Leave (credited from Sunday/Holiday work) and Allotted Leave (system-wide fixed balance, carries forward indefinitely), with full apply/approve/deduct/reverse flow.
- Reports: MD Monthly Summary, MD Audit/Changes, Employee Monthly Calendar Export (PDF/CSV), and MD XLSX export.
- Security: Google Login; MD daily login; single active session per user (new login auto-logs out old device); encryption; brute-force protection; alerts on new device login.
- Audit logs: All key events recorded; 1-year online retention; on-prem encrypted archival; best-effort restores.

**Non-Goals (v1)**

- Biometric devices
- Timesheets, hours, clock in/out
- Manager or HR roles
- Geo-fencing enforcement
- Complex shift management
- Leave carry-forward expiry (balances never expire)

---

## 2. Users & Roles

**Employee**

- Marks Present once per day by selecting Office or Site.
- Can submit attendance on Sundays and Public Holidays — if MD approves, one Earned Leave is credited automatically.
- Can submit attendance only once per day; if rejected, may resubmit one more time on the same day (maximum two submissions per day total).
- Sees full calendar view showing: Approved, Pending, Rejected (with reason visible), Absent, On Leave, and Holidays.
- Applies for leave (single or multi-day range), selects leave type (Earned or Allotted), and can cancel a pending application themselves before MD acts on it.
- Receives notifications on approval, rejection, MD edits, and leave decisions.
- Can export their monthly calendar as PDF or CSV.
- Can view their own audit history (live and archived on request).
- Sees their own leave balances (Earned Leave and Allotted Leave) on their profile/dashboard.

**MD**

- Also an employee: marks own attendance which is auto-approved upon submission (no manual approval required for MD's own attendance).
- Sole approver for all employee attendance entries and all leave applications.
- Can approve individually or in bulk; rejection requires a mandatory reason from a predefined list plus an optional note.
- Can edit approved attendance entries (reason mandatory).
- Can convert Absent to Present for any employee within the system-wide configurable backdating window (reason mandatory).
- Can cancel/reverse an already approved leave application; balance is restored automatically on reversal.
- Manages the Sites list (add, edit, deactivate/remove — removed sites retain their name as a text label in historical entries).
- Manages the Holiday list via UI.
- Creates employees (Name and Email only); shares the app link manually with the employee.
- Archives employee accounts when they leave (data and history preserved, account marked as ex-employee, hidden from active lists).
- Views Today's Dashboard: Pending, Approved, Absent, and leave requests.
- Access to all audit logs (live and archived).
- Exports XLSX monthly summary.
- Controls system-wide settings: backdating window (X days), reminder notification time, Allotted Leave allotment count.

---

## 3. Core Rules & Workflow

### 3.1 Attendance Marking (Employee)

- One submission per day (Present only) with Office or Site selection from dropdown.
- No auto-present; employee must submit manually.
- Same-day only window: 12:00 AM to 11:59 PM IST (server time).
- No backdated submissions by employees.
- Employees can also submit on Sundays and Public Holidays within the same window; these are treated as regular submissions requiring MD approval, and EL is credited automatically if approved.
- If no submission exists by 11:59 PM IST, the system auto-marks the employee as Absent.
- If a pending submission exists at 11:59 PM IST, it stays as Pending — the MD can still approve it the next day. The attendance date remains the date of original submission.
- Maximum two submissions per day: one initial, one resubmit after rejection. No further resubmissions allowed.

### 3.2 Approval (MD)

- MD approves every employee entry individually or in bulk.
- Bulk approval: MD can checkbox individual entries and approve selected, or select all and approve all in one click. Both options available.
- Rejection requires a mandatory reason from the predefined list plus an optional free-text note.

**Rejection reasons:**
1. Wrong Site Selected
2. Wrong Office Selected
3. Wrong Day Selected
4. Marked by Mistake
5. Not Allowed to Mark for Today
6. Submit Correct Location
7. Incomplete Information
8. Not Present Today
9. Other (custom note)

- After rejection the employee may resubmit once more on the same day. After that second submission, no further resubmission is allowed regardless of outcome.

### 3.3 MD's Own Attendance

- MD submits attendance exactly like an employee (Office or Site, same time window, same Sunday/Holiday rules).
- MD's submission is auto-approved immediately upon submission — no manual approval step.
- MD's auto-approved Sunday/Holiday attendance credits EL to the MD's own balance just like any employee.
- MD's attendance appears in all reports and exports.

### 3.4 Post-Approval Edits (MD)

- MD can modify an approved entry (e.g., Office to Site or vice versa); reason is mandatory.
- Employee receives in-app and push notification on MD edit.
- MD also receives a success notification.
- Edit is recorded in audit log with before/after values and reason.

### 3.5 Absent Handling

- At 11:59 PM IST, if no submission exists, the system creates an Absent record for that employee.
- Only MD can convert Absent to Present within the system-wide configurable backdating window (default configurable by MD, e.g., 7 days).
- MD must select Office/Site and provide a mandatory reason.
- Both MD and employee receive notifications on conversion.
- Conversion is recorded in audit log.

### 3.6 MD Daily Timeline

- Employees can submit from 12:00 AM to 11:59 PM IST.
- MD approvals can happen any time, including the next day for pending entries.
- Attendance date is always the date of original submission.

---

## 4. Leave Management System

The leave system is a distinct module from daily attendance. It manages two leave balance types and a full apply/approve/deduct/reverse flow.

### 4.1 Leave Types

**Earned Leave (EL)**
- Credited automatically when an employee's Sunday or Public Holiday attendance is approved by MD.
- Each approved Sunday or Public Holiday attendance = +1 EL credit.
- Balance carries forward indefinitely; no expiry.
- MD can also manually credit EL to an employee if needed (with a reason recorded in audit).

**Allotted Leave (AL)**
- A fixed number of leaves granted system-wide to every employee (e.g., 12 per year).
- The MD configures the allotment count in system settings.
- Balance carries forward indefinitely; no expiry, no annual reset.
- MD can adjust an individual employee's AL balance manually if needed (with a reason).

### 4.2 Applying for Leave (Employee)

- Employee selects a date range (multi-day supported, e.g., Jan 5–Jan 8).
- Employee selects which leave type to deduct from: Earned Leave or Allotted Leave.
- If the selected balance is zero, the system does not block the application — it is flagged as Unpaid/LOP and the MD can still approve or reject it.
- Employee can add an optional reason/note with the application.
- Application goes to MD for approval.

### 4.3 Leave Approval Flow (MD)

- MD sees all pending leave applications in their dashboard.
- MD can approve or reject each application.
- Rejection requires a mandatory reason.
- On approval: balance is deducted from the selected leave type; the day(s) appear as "On Leave" in the employee's attendance calendar.
- On rejection: no balance change; employee is notified with the reason and can reapply.

### 4.4 Cancellation & Reversal

**Employee cancellation (before MD acts):**
- Employee can cancel their own pending leave application before MD approves or rejects it.
- No balance change on cancellation of a pending application.

**MD cancellation (pending):**
- MD can also reject/cancel any pending leave application.

**MD reversal of approved leave:**
- MD can cancel/reverse an already approved leave application at any time.
- On reversal: the deducted balance is fully restored to the employee's account.
- The calendar day(s) revert from "On Leave" back to Absent (or their actual attendance status if one exists).
- Both MD and employee receive notifications on reversal.
- Reversal is recorded in audit log with reason.

### 4.5 Leave Calendar Display

- Leave days appear as a distinct "On Leave" status in the employee's attendance calendar.
- Unpaid/LOP approved leaves appear as a distinct "Unpaid Leave" status.
- Leave balances (EL and AL) are visible to both the employee and MD on their respective profile/dashboard views.

### 4.6 Leave in Reports

- MD Monthly Summary includes: EL balance, AL balance, leaves taken (EL), leaves taken (AL), unpaid/LOP leaves taken, EL credited (from Sunday/Holiday work).
- XLSX export includes leave columns alongside attendance columns.

---

## 5. Work Calendar Rules

- **Time zone:** IST (server time only); device time is ignored entirely.
- **Work week:** Monday to Saturday.
- **Sundays:** Always off. However, if an employee submits attendance on a Sunday and MD approves it, one EL is credited. The day appears as "Approved (Sunday)" in the calendar.
- **Public Holidays:** Managed by MD via UI. Same holiday list for all employees (not location-specific). On holidays, attendance is not required; days show as "Holiday" in calendar. If attendance is submitted and approved on a holiday, one EL is credited.
- **Optional holidays:** Not supported in v1; all holidays are mandatory/uniform.

---

## 6. Notifications

**Channels:** In-app (always) and Push (even when app is closed).

**Reminder notification:** A configurable daily reminder is sent to employees (and MD) who have not yet marked attendance by a MD-configured time (e.g., 9:00 PM IST). The reminder time is set system-wide by the MD.

**Attendance events:**

- On MD approval of employee entry → MD: "Approval recorded for [Employee] on [Date]." | Employee: "Your attendance for [Date] has been approved."
- On MD rejection → MD: "Rejection recorded for [Employee] on [Date]." | Employee: "Your attendance for [Date] was rejected. Reason: [Reason]."
- On MD edit of approved entry → MD: "You modified attendance for [Employee] on [Date]." | Employee: "Your attendance for [Date] was modified by MD. Updated: [Office/Site]."
- On Absent to Present conversion → MD + Employee: notified with new status and date.
- On new device login → User: "A new device logged into your account. Previous session ended."

**Leave events:**

- On leave application submitted → MD: "New leave request from [Employee] for [Date range]."
- On MD approval of leave → Employee: "Your leave for [Date range] has been approved."
- On MD rejection of leave → Employee: "Your leave for [Date range] was rejected. Reason: [Reason]."
- On employee cancellation of pending leave → MD: "Leave request from [Employee] for [Date range] was cancelled by the employee."
- On MD reversal of approved leave → Employee: "Your approved leave for [Date range] has been cancelled by MD. Balance restored."

**Performance:** Push delivery ≤ 1 second end-to-end.

---

## 7. PWA Requirements

- Installable app (Add to Home Screen) on Android, iOS, and Desktop.
- Offline mode (limited): App shell loads offline; submissions and history require connectivity; background sync queues submissions if offline and auto-sends when back online.
- Push notifications via Service Workers for all events listed in Section 6.
- Real-time sync via WebSockets or SSE: dashboards and status updates without manual refresh.

**Device and browser support:**
- Android: Chrome, Edge, Samsung Browser
- iOS Safari: iOS 16+ (push supported; background sync limited)
- Windows Desktop: Chrome, Edge, Firefox (graceful degradation for PWA push on Firefox)
- macOS Desktop: Safari (limited push), Chrome (full)
- Tablets: iPad and Android tablet via Safari, Chrome, Edge

---

## 8. Security & Authentication

- **Auth:** Google Login (OAuth) for MD and all employees. Passwordless.
- **MD session:** Daily login required once per day via Google. After login, no re-login needed for the rest of the day on that device. Session and device trust expire at 11:59 PM IST or on logout.
- **Employee session:** Resets on logout.
- **Device policy:** One active session per user. If a user logs in from a second device, the old session is automatically terminated and the user is notified.
- **Transport security:** HTTPS only.
- **At-rest encryption:** Database and file storage encrypted.
- **Abuse protection:** Login blocked after a configurable number of failed attempts.
- **New device alert:** User is notified when a new device logs in and old session is killed.

**Employee onboarding flow:**
- MD creates employee by entering Name and Email only.
- MD manually shares the app link with the employee.
- Employee visits the link and logs in with their registered Google account. Account is active immediately — no invite email required.
- If the email does not match any registered employee, login is denied.

**Employee offboarding flow:**
- MD archives the employee account.
- Account is marked as ex-employee and hidden from all active lists and dashboards.
- All historical data, attendance, leave records, and audit logs are preserved.
- Archived employees cannot log in.

---

## 9. Data Model (Logical)

**Employee**
`id`, `name`, `email`, `role` (employee | md), `status` (active | archived), `created_at`, `archived_at`

**AttendanceEntry** (one per day per employee)
`id`, `employee_id`, `date` (YYYY-MM-DD), `status` (pending | approved | rejected | absent), `selection_type` (office | site), `site_id` (nullable if office), `is_off_day` (boolean — true if Sunday or Holiday), `submission_count` (1 or 2), `submitted_at`, `approved_at`, `rejected_at`, `rejection_reason_code`, `rejection_reason_note`, `modified_by_md_at`, `md_edit_reason_code`, `md_edit_reason_note`

**LeaveApplication**
`id`, `employee_id`, `from_date`, `to_date`, `days_count`, `leave_type` (earned | allotted), `is_lop` (boolean), `status` (pending | approved | rejected | cancelled | reversed), `employee_note`, `rejection_reason`, `applied_at`, `decided_at`, `decided_by`, `reversed_at`, `reversal_reason`

**LeaveBalance**
`id`, `employee_id`, `earned_leave_balance`, `allotted_leave_balance`, `updated_at`

**LeaveTransaction** (audit trail for balance changes)
`id`, `employee_id`, `type` (credit | debit | reversal | manual_adjustment), `leave_type` (earned | allotted), `amount`, `reference_id` (attendance_entry_id or leave_application_id), `reason`, `created_at`

**Site**
`id`, `name`, `active` (boolean), `created_at`, `updated_at`, `deactivated_at`

**Holiday**
`id`, `date`, `name`, `created_at`

**AuditEvent**
`id`, `actor_id`, `actor_role`, `action_type`, `entity_type`, `entity_id`, `before`, `after`, `reason_code`, `reason_note`, `ip`, `user_agent`, `created_at`

**NotificationLog**
`id`, `recipient_id`, `channel` (push | in_app), `event_type`, `payload`, `status` (sent | failed), `created_at`, `delivered_at`

**SystemSettings**
`backdating_window_days`, `reminder_time_ist`, `allotted_leave_allotment`

---

## 10. Dashboards & UI

**Employee — Home**
- "Mark Attendance" button with Office or Site dropdown; submit.
- Today's current status shown (Pending / Approved / Rejected / Absent / On Leave / Holiday / Sunday).
- Leave balance summary: EL balance and AL balance visible.

**Employee — Calendar View**
- Monthly grid showing each day's status: Approved Present, Pending, Rejected (with reason on tap), Absent, On Leave, Unpaid Leave, Holiday, Sunday Off, Approved Sunday/Holiday (EL earned).
- Leave application button to apply for leave (date range picker, leave type selector).
- Pending leave applications listed with status.

**Employee — Exports**
- Monthly PDF or CSV of the full calendar view including statuses, leave, and holidays.

**MD — Today's Overview**
- Pending Approval list: employee name, office/site, submitted time, checkbox for bulk selection.
- Bulk actions: "Approve Selected" and "Approve All" buttons.
- Approved Today list.
- Absent (Unmarked) list for today.
- Pending Leave Applications list.
- All lists update in real time.

**MD — Employee Management**
- Create employee (Name, Email).
- View all active employees; archive an employee.
- Per employee: view attendance history, leave balance, leave history, audit log.

**MD — Leave Management**
- View all pending leave applications with employee name, date range, leave type, note.
- Approve or reject each (rejection requires reason).
- View approved/reversed leave history.
- Manually adjust EL or AL balance for an employee (reason mandatory, logged in audit).

**MD — Sites Management**
- Add, edit, deactivate/remove sites.
- Removed sites retain their name as static text in all historical entries.

**MD — Holiday Management**
- Add, edit, delete holidays via UI.
- Calendar view of all configured holidays for the year.

**MD — Reports**
- Monthly Summary per employee.
- Audit/Changes report.
- XLSX export for selected month.

**MD — System Settings**
- Backdating window (X days) for Absent to Present conversions.
- Daily reminder notification time (IST).
- System-wide Allotted Leave allotment count.

---

## 11. Reports & Exports

**MD — Monthly Summary (per employee)**
Columns: Present (Approved), Absent, Rejected, Pending, Office count, Site count, Sundays/Holidays worked (approved), EL credited this month, EL balance, AL balance, Leaves taken (EL), Leaves taken (AL), Unpaid/LOP leaves.

**MD — Audit/Change Report**
All MD rejections, edits, Absent-to-Present conversions, leave approvals/rejections/reversals, and manual balance adjustments — with reason, notes, before/after values, timestamps, and actor.

**MD — XLSX Export (selected month)**
Columns: Date, Employee Name, Email, Status, Day Type (Weekday / Sunday / Holiday), Selection Type (Office/Site), Site Name (if any), Submitted At, Approved At, Rejected At, Rejection Reason, Modified By MD At, Edit Reason, Leave Type (if on leave), Leave Status, Final Status.

**Employee — Monthly Calendar Export**
PDF or CSV of full calendar view with all day statuses, leave, and holidays.

---

## 12. Audit & Retention

**Events logged:**
- Employee attendance submissions (each submission attempt)
- MD approvals and rejections with reasons
- MD edits to approved entries (before/after + reason)
- MD Absent to Present conversions (with reason)
- Leave applications, approvals, rejections, cancellations, reversals
- Manual leave balance adjustments by MD
- Login events (success and failure, device info)
- New device login alerts
- Session terminations
- Notification delivery (sent/failed with timestamps)

**Visibility:**
- MD can view all audit logs (live and archived).
- Employee can view their own audit logs (live and archived on request).

**Retention:**
- Live DB: 1 year of audit logs.
- After 1 year: archived to on-prem encrypted storage and removed from live DB.
- Restore SLA: best effort, no strict time guarantee.
- Archive access: MD full; employee can request their own logs only.

---

## 13. Performance & Availability

- API P95 ≤ 150 ms
- Push notification delivery ≤ 1 second end-to-end
- Real-time UI updates ≤ 1 second via WebSocket/SSE
- App first meaningful paint ≤ 1 second on 4G
- XLSX export for up to 5,000 employees within 20 seconds
- Availability target: 99.9% monthly

---

## 14. Acceptance Criteria

**Attendance marking**
Given it is today (IST) and within the 12:00 AM–11:59 PM window, when an employee submits Present with Office or Site selected, the system stores one entry for today with status Pending, shows a success toast within 1 second, and the entry appears on MD's Pending list in real time.

**Sunday/Holiday attendance**
When an employee submits on a Sunday or Public Holiday and MD approves it, the system credits +1 EL to the employee's balance immediately and the day shows as "Approved (Sunday/Holiday)" in the calendar.

**Resubmission limit**
After one rejection, the employee may resubmit once. After the second submission (regardless of outcome), the system blocks any further submission for that day with a clear message.

**Auto Absent**
At 11:59 PM IST, for any employee with no submission for the day, the system creates an Absent record. It shows as Absent in their calendar and on MD's dashboard the next day.

**Pending at midnight**
If a submission is in Pending status at 11:59 PM IST, it remains Pending. MD can approve or reject it the next day. The attendance date does not change.

**MD own attendance**
When MD submits attendance, it is auto-approved immediately with no manual action required. EL is credited if the day is a Sunday or Holiday.

**Absent to Present conversion**
MD selects Office/Site and a mandatory reason; system checks the entry date is within the configured backdating window; status changes to Approved/Present; both MD and employee are notified; audit log records before/after.

**Leave application**
Employee selects date range and leave type; if balance is zero the application is still submitted and flagged as LOP; MD receives a notification; MD approves or rejects; on approval balance is deducted and calendar days show as "On Leave."

**Leave reversal**
When MD reverses an approved leave, the deducted balance is restored to the employee's account, the calendar days revert to their prior status, both parties are notified, and the reversal is recorded in the audit log.

**Device policy**
When a user logs in from a second device, the first session is terminated immediately and the user is notified on the new device that they have been logged in and the old session has ended.

**Site removal**
When MD deactivates or removes a site, all historical attendance entries that referenced that site continue to display the site name as static text in all views and exports.

**MD Dashboard**
Shows real-time lists for today: Pending, Approved, Absent, and Pending Leave Requests. All lists update without refresh.

**Security**
MD must perform Google Login once per day; after that no re-login is needed on that device until 11:59 PM IST. Attempting to access the system after session expiry redirects to Google Login.

---

## 15. Open Questions (resolved vs. pending)

**Resolved in v2.0:**
- Holiday management: MD manages via UI.
- Resubmission limit: One resubmit after rejection per day.
- Pending at midnight: Stays pending; MD approves next day.
- Absent to Present window: System-wide configurable by MD.
- Second device login: Auto-terminates old session.
- Team size: Small team (1–25 employees).
- Employee notes on submission: Not included; keep it simple.
- Employee onboarding: MD shares link manually; employee logs in with registered Google account.
- Rejected calendar display: Shows as Rejected separately with reason visible.
- MD attendance: MD marks own attendance; auto-approved on submission.
- Site removal: Past entries preserve site name as static text.
- Employee offboarding: Archive (data kept, hidden from active lists).
- Reminder notifications: Configurable time set by MD system-wide.
- Leave carry-forward: Indefinite, no expiry.
- EL credits: Sundays and Public Holidays both qualify.
- Leave cancellation: Employee can cancel pending; MD can cancel pending or reverse approved.
- Bulk approval UI: Both "Approve Selected" and "Approve All" available.

**Still open (confirm before build):**
1. Branding: Any logo, theme colours, or app name/icon for the PWA?
2. Notification copy: Final text to be confirmed during UI design phase?
3. Language: English only for all UI and rejection reasons in v1?
4. Privacy policy/terms: Static page bundled in the app?
5. Default backdating window: What should the default X days be before MD changes it?
6. Default Allotted Leave count: What is the initial system-wide allotment number?
7. Default reminder time: What should the default daily reminder time be (e.g., 9:00 PM IST)?

---

## 16. Release Plan

**v1 (Release)**
- Employee Present marking (Office/Site), Sunday/Holiday submission for EL
- MD approvals (individual and bulk), rejections with reason, max one resubmit per employee per day
- MD edits and Absent to Present conversion within configurable window
- MD own attendance with auto-approval
- Leave Management: EL and AL balances, apply/approve/reject/cancel/reverse flow, LOP handling
- Holiday management via MD UI
- PWA: install, push notifications, real-time sync, background sync
- Reminder notifications (configurable time)
- Employee: calendar view (all statuses including leave), leave balance display, PDF/CSV export
- MD: Today dashboard, leave management, monthly summary, audit report, XLSX export, system settings
- Security: Google login, MD daily login, single active session, auto-logout old device, encryption, new device alerts
- Audit logging, 1-year retention, on-prem archival

**v1.1 (Optional next)**
- Bulk rejections with per-item reasons
- Lightweight analytics widgets (monthly attendance rate, leave utilisation)
- Simple theming and branding customisation
- LOP report / payroll-ready export
