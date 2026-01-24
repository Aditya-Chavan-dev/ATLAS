# Legacy Code Inventory
**Date:** 2026-01-24

## Files to Delete (Phase 9)

### Frontend
1.  **`src/components/UnifiedProfile.tsx`**
    *   **Reason**: Reads/Writes to legacy `users` node. Reimplement using `employees` node if needed.
    *   **Dependencies**: Used in `App.jsx` presumably.

2.  **`src/features/owner/hooks/useOwnerUsers.ts`**
    *   **Reason**: Direct RTDB access for management. Logic should move to Backend API (`admin/users`).

3.  **`src/features/auth/hooks/useUserProfile.ts`**
    *   **Reason**: Reads `employees` directly. Should potentially stay for read-only UI, but careful with stale data.

### Backend
1.  **`server/src/middleware/authMiddleware.js`**
    *   **Reason**: Vulnerable to VULN-001 (No status check). Will be replaced by `unifiedAuthMiddleware.js`.

### Database
1.  **`users` Node** (Realtime Database)
    *   **Reason**: Deprecated.
    *   **Action**: Backup -> Migrate -> Delete.

## Files to Refactor

1.  **`server/src/controllers/authController.js`**
    *   **Current**: Handles creation/role changes.
    *   **New**: Needs to support Transactional Creation and Immediate Revocation.

2.  **`database.rules.json`**
    *   **Current**: Relies on Custom Claims.
    *   **New**: Needs to align with backend authorization or be locked down further.

3.  **`src/features/auth/services/authService.ts`**
    *   **Current**: Handles "Self-Onboarding".
    *   **New**: Remove profile creation logic. Purely for `signInWithPopup`.
