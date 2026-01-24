# New Auth System Rollout Plan

## 1. Pre-Rollout Checklist
- [ ] **Backup**: Run `server/scripts/backup/backup-firebase-data.js`.
- [ ] **Config**: Ensure `database.rules.json` is ready (but maybe keep old rules permissive if needed until cutover, or use new rules immediately if compatible).
- [ ] **Flags**: Set `NEW_AUTH_ENABLED` = `false` in `config/featureFlags` in DB.

## 2. Gradual Migration (Data)
*   **Action**: Run `server/scripts/migration/gradualMigration.js`.
*   **Monitor**: Check logs for errors.
*   **Verification**: Run `server/scripts/migration/migrationVerification.js` on random UIDs.

## 3. Canary Deployment (Code)
*   Deploy Backend code to **Staging**.
*   Verify API endpoints with a Test User.
*   Deploy Backend code to **Production**.

## 4. Feature Flag Rollout (Traffic)
1.  **Stage 1: Internal Users (0%)**
    *   Add admins to `BETA_USERS` whitelist in DB feature flags.
    *   Verify Login and Admin Actions.
2.  **Stage 2: 10% Rollout**
    *   Update DB: `ROLLOUT_PERCENTAGE` = 10.
    *   Monitor 1 hour: Latency, Error Rates (`metricsCollector`).
3.  **Stage 3: 50% Rollout**
    *   Update DB: `ROLLOUT_PERCENTAGE` = 50.
    *   Monitor 4 hours.
4.  **Stage 4: 100% Rollout**
    *   Update DB: `ROLLOUT_PERCENTAGE` = 100.
    *   Full Cutover.

## 5. Post-Rollout
*   Wait 24 hours.
*   If stable, proceed to Phase 9 (Cleanup).

## 6. Rollback Triggers
*   **High Error Rate**: > 1% Auth Failures.
*   **Latency Spike**: > 500ms avg.
*   **Action**: Set `NEW_AUTH_ENABLED` = `false` immediately via Firebase Console.
