# ATLAS Security Incident Log

## Incident History

### [SEC-2025-001] Audit Log Write Access Vulnerability
- **Date**: 2025-12-28
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ RESOLVED
- **Component**: Firebase Realtime Database (`/audit` node)

#### Description
During a routine security audit (Clean Sweep Phase 4), it was discovered that the `/audit` node in the Firebase Realtime Database had its `.write` rule set to `"auth != null"`. This allowed **any authenticated user** (including Employees with basic access) to:
1.  Write fake audit logs.
2.  Overwrite existing audit logs.
3.  Flood the audit log node (Denial of Service).

#### Remediation
- **Patch**: The `.write` rule for `/audit/$logId` was changed to `false`.
- **Logic**: This prevents *all* client-side write operations.
- **Service Continuity**: The Backend service matches write operations using the `firebase-admin` SDK (Service Account), which inherently bypasses security rules. Therefore, legitimate server-side logging remains functional while client-side tampering is impossible.

#### Verification
- **Rule Deployment**: `firebase deploy --only database` executed successfully.
- **Codebase Scan**: Confirmed no client-side code (`src/`) attempts to write to `/audit`.

---
