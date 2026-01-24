# Authentication & Authorization Architecture
**Version:** 2.0 (Secure Implementation)
**Date:** 2026-01-24

## 1. Overview
The ATLAS Authentication System is designed with a **Zero-Trust** and **Fail-Closed** philosophy. It eliminates reliance on stale client-side tokens by enforcing real-time server-side validation for every request.

## 2. Core Components

### A. Unified Authorization Middleware (`unifiedAuthMiddleware.js`)
The gatekeeper for all protected routes. It performs 3 checks in strict order:
1.  **Token Validation**: Verifies Firebase ID Token signature & expiry. Checks revocation status with Firebase Auth Server (`checkRevoked: true`).
2.  **Session Blacklist**: Checks in-memory/DB blacklist for immediate rejection of suspended users.
3.  **Database Authorization**: Fetches real-time status and role from `employees/{uid}/profile`.
    *   *Rule*: `status` MUST be 'active'.
    *   *Rule*: `role` MUST be 'MD' or 'EMPLOYEE'.

### B. Role Management (`roleManagementController.js`)
Handles role transitions (e.g., Employee <-> MD).
*   **Atomic Updates**: Updates DB and Custom Claims.
*   **Access Termination**: If a user is demoted, their "refresh tokens" are revoked immediately, and they are temporarily blacklisted to ensure no race conditions allow access.

### C. Security Controls
*   **Rate Limiting**: Multi-tier limits (Auth vs API vs Mutation).
*   **DDoS Protection**: IP throttling and volumetric analysis.
*   **Audit Logging**: All security events (login, role change, rejection) are logged to the `audit` node.

## 3. Data Flow

### Login Flow
1.  Frontend: `signInWithPopup(Google)` -> Gets ID Token.
2.  Frontend: `GET /api/auth/me` (Token).
3.  Backend: `unifiedAuthMiddleware` validates token & DB status.
4.  Backend: Returns usage profile.

### User Creation Flow (Admin Only)
1.  Frontend: `POST /api/admin/users/create`.
2.  Backend: Checks MD Role.
3.  Backend: Transactionally creates Auth User + DB Profile.
4.  Backend: Sets Custom Claims.

## 4. Security Guarantees
*   **Suspension**: Immediate access loss (max latency < 100ms via Blacklist).
*   **Demotion**: Immediate privilege loss (DB check is real-time).
*   **Data Integrity**: No zombie accounts; atomic creation.
