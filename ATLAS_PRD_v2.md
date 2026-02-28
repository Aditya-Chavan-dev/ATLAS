# ATTENDANCE MANAGEMENT SYSTEM — PRD v1.2

> [!IMPORTANT]
> **Single Source of Truth** — v1.2 (Role Descriptions & Global Real-Time Rule)
> This document overrides all previous specifications.

## 1. Purpose & Problem Statement
A PWA where employees mark attendance (Office/Site) via phone. MD approves/rejects in real time. Owner manages roles.

## 2. User Roles & Permissions (RBAC)
The system uses three distinct roles. Role changes take effect in real time.

| Role | Access Level | Key Responsibilities |
| :--- | :--- | :--- |
| **Employee** | Restricted | Mark attendance, apply leave, view own records, edit profile. |
| **MD** | Elevated | Approve/reject requests, view all records, auto-approved own attendance. |
| **Owner** | Administrative | Assign and change user roles only. No access to attendance/leave data. |

### 2.1 Role Descriptions
- **Owner**: Pre-seeded user (`role: owner`, `isProfileComplete: true`). Sole responsibility: role assignment.
- **MD**: Operational authority. Receives FCM push notifications for every request. Atomic transfer of MD role demotes previous MD.
- **Employee**: Primary users. Submit attendance/leave. View own live status.

### 2.2 Role Assignment & Auth
- New signups default to **Employee**.
- **Owner** promotes/demotes users via app UI.
- Atomic MD Reassignment: Demote old MD, promote new MD, flag pending records with `pendingReassigned: true`.

## 3. Core Entities (Data Model)
*Note: All logic is client-side implementation using **Firebase Realtime Database (RTDB)** as per system guardrails.*

### 3.1 User
- `uid`: string (Primary Key)
- `name`: string
- `email`: string (Read-only)
- `phone`: string (10-digit)
- `dob`: string (YYYY-MM-DD IST)
- `role`: enum (`employee` | `md` | `owner`)
- `isProfileComplete`: boolean
- `fcmToken`: string
- `createdAt`, `updatedAt`: IST strings

### 3.2 AttendanceRecord
- `userId`: ref (User.uid)
- `date`: string (YYYY-MM-DD IST)
- `location`: enum (`office` | `site`)
- `status`: enum (`pending` | `approved` | `rejected` | `auto_approved`)
- `submittedAt`, `reviewedAt`, `updatedAt`: IST strings
- `reviewedBy`: ref (User.uid)
- `isResubmission`: boolean
- `pendingReassigned`: boolean

### 3.3 LeaveRecord
- `fromDate`, `toDate`: string (YYYY-MM-DD IST)
- `leaveType`: string ('general' for v1)
- `reason`: string (Required)
- `status`: enum (`pending` | `approved` | `rejected`)

## 4. Core User Flows
1. **Registration**: First login redirect to Profile Form if `isProfileComplete` is false.
2. **Attendance**: Duplicate check (IST date). MD receives Push Notification. Live status updates.
3. **Resubmission**: Rejection allows resubmit (new record, old preserved).
4. **Auto-Approve**: MD's own attendance bypasses queue.
5. **Leave**: Request submitted -> MD notified -> Status updated live.
6. **Role Config**: Owner reassigns MD atomically.

## 5. Global Real-Time Rule
**Every data-driven change must reflect in the UI in real time without page refresh.**
- Real-time listeners (`onValue` for RTDB) for status changes, queues, roles, and profile updates.
- Proper cleanup of listeners on unmount.

## 6. Notification Rules
- **MD Only**: FCM Push for new submissions.
- **All Users**: In-app live status updates and toasts.

## 7. Technology Stack (ATLAS Guardrail Aligned)
- **Frontend**: React (PWA)
- **Database**: Firebase Realtime Database (RTDB) — *Note: Swapped from Firestore for compliance.*
- **Backend**: 100% Client-Side Logic + Security Rules — *Note: Swapped from Node.js for compliance.*
- **Auth**: Firebase Auth
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Timezone**: IST only (UTC+5:30)

## 8. Out of Scope v1
- Leave balances, limits, or types beyond 'general'.
- GPS / Geo-fencing checks.
- SMS notifications.
- Attendance correction after approval.
