# Rollback Plan
**Date:** 2026-01-24

## Trigger Conditions
Initiate rollback immediately if any of the following occur during deployment/migration:
1.  **Data Loss**: Verification script fails or data is missing.
2.  **Auth Failure**: > 1% of users cannot login.
3.  **Critical Bug**: Application crashes or main loop blocked.

## Procedure

### 1. Data Restoration
If database corruption occurs:

1.  Stop the server:
    ```bash
    pm2 stop all
    ```
2.  Identify the last known good backup in `server/backups/`.
3.  Run restoration (Script to be created in Phase 8, manual for now):
    *   *Manual*: Import JSON via Firebase Console > Realtime Database > Import JSON.
    *   *Warning*: This overwrites current data.

### 2. Code Rollback
If application code is broken:

1.  Revert git commit:
    ```bash
    git revert HEAD
    git push origin main
    ```
2.  Redeploy to Render (or wait for auto-deploy).

### 3. Service Restart
1.  Flush Redis cache (if enabled).
2.  Restart Node.js service.
3.  Verify Health Check (`/health`).

## Communication
*   **Slack**: Notify `#ops` channel "Rollback initiated for Release X".
*   **Email**: Send advisory to `all-hands` if downtime > 15 mins.
