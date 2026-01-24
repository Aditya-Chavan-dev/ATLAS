# Runbook: Emergency User Lockout

**Trigger**: Suspicion of account compromise, rogue employee, or lost device.
**Goal**: Immediately seize all access for a specific user ID.

## Procedure

### Method A: Admin Dashboard (Recommended)
1.  Login as MD.
2.  Find User > Click **Suspend**.
3.  Verify: User status changes to `suspended`.

### Method B: Manual API (If Dashboard Down)
1.  Get your Admin Token.
2.  Run CURL:
    ```bash
    curl -X POST https://api.yourdomain.com/api/auth/suspend-employee \
      -H "Authorization: Bearer <YOUR_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"targetUid": "<COMPROMISED_UID>", "reason": "Emergency Lockout"}'
    ```

### Method C: Database Override (Nuclear Option)
*Use only if API is unresponsive.*
1.  Go to Firebase Console > Realtime Database.
2.  Navigate to `employees/<UID>/profile`.
3.  Manually change `status` value to `"suspended"`.
    *   *Note*: This stops API access (via Middleware check) but might not revoke Token immediately until cache clears (up to 1h without API revocation). **Method A/B is preferred.**

## Post-Incident
1.  Check Audit Logs (`audit` node) for activity by that user *before* the lockout.
2.  Rotate secrets if they had admin access.
