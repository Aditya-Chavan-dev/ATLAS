# Verification Plan: Universal Notification System

## Changes Implemented
1.  **Backend (Universal Delivery)**:
    -   Updated `notificationService.js` to support topic-based broadcasting (`sendTopicNotification`).
    -   Updated `notificationController.js` to use `atlas_all_users` topic for manual triggers and morning reminders.
    -   Updated `runMorningReminder` to run at **11:00 AM IST** and broadcast to everyone.
    -   Added API endpoints `/api/notifications/subscribe` and `/api/notifications/unsubscribe`.

2.  **Frontend (Auto-Subscribe)**:
    -   Updated `fcm.js` to automatically call the subscribe endpoint when a token is obtained.
    -   Updated `MDLayout.jsx` and `EmployeeProfile.jsx` (`Profile.jsx`) to unsubscribe from the broadcast topic on logout.
    -   Added **In-App Banner** listener to `MDLayout.jsx` so MDs specifically see broadcast alerts.

## How to Test
1.  **Login**:
    -   Log in as an Employee or MD.
    -   Open DevTools Console.
    -   Verify logs: `FCM Token obtained: ...` followed by `✅ Subscribed to broadcast system`.

2.  **Send Manual Broadcast (MD Only)**:
    -   If you have MD access, trigger a "Reminder" (if UI available) or use the `test-notification` endpoint if exposed.
    -   Or wait for 11:00 AM IST.

3.  **In-App Banner**:
    -   Trigger a test notification (manual trigger).
    -   Verify a toast appears in the top-right corner of the screen for both MD and Employee dashboards.

4.  **Logout**:
    -   Click Logout.
    -   Verify log: `✅ Unsubscribed from broadcast system` (or similar success message).

## Key Files Modified
-   `backend/src/controllers/notificationController.js`
-   `backend/server.js`
-   `src/services/fcm.js`
-   `src/layouts/MDLayout.jsx`
-   `src/employee/pages/Profile.jsx`
