# Security Audit Checklist
**Frequency:** Quarterly

## Authentication Review
- [ ] **Failed Logins**: Check `audit` logs for high failure rates from specific IPs.
- [ ] **Blacklist**: Verify `ipBlacklist` size. If > 1000, review for cleanup.
- [ ] **Dormant Accounts**: Identify users with no login > 90 days. Archive them.

## Authorization Review
- [ ] **MD Role Audit**: List all users with 'MD' role. Verify they still hold that position.
- [ ] **Privilege Creep**: Ensure 'EMPLOYEE' role hasn't gained unauthorized access via rule changes.

## Infrastructure
- [ ] **Backups**: Verify nightly backups are running and **restorable** (Test Restore).
- [ ] **Rate Limits**: Check if legitimate users are hitting limits (Adjust `rateLimitConfig`).
- [ ] **Secrets**: Rotate `SESSION_SECRET` and Firebase Service Account keys annually.
