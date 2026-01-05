# FEATURE_ENHANCEMENT

## What was the previous feature?
The attendance API accepted any valid date string (`YYYY-MM-DD`), allowing users to mark attendance for far-future dates or backdate attendance (e.g., filling in last month's missed days) without restriction.

## What was enhanced?
We implemented **Strict Time-Window Enforcement** middleware logic within the attendance controller.

## Steps taken
1.  **Future Block**: Rejected any request where `date > today`.
2.  **Stale Block**: Rejected any request where `date < today - 48 hours`.
3.  **Role Exemption**: Allowed `admin`, `md`, and `owner` roles to bypass these checks for correction purposes.

## Why this approach?
This enforces "Real-Time" attendance habits.
-   **No "Pre-filling"**: You can't mark attendance for tomorrow.
-   **No "Ghosting"**: You can't wake up on Friday and fill in attendance for Monday.
-   **Exception**: Operations/Admins retain control to fix mistakes.

## Affected Files
-   `backend/src/controllers/attendanceController.js`
