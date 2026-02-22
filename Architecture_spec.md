# ATLAS Architecture Specification (v2.0)

## 1. System Overview
ATLAS (Attendance Tracking and Logging Automation System) is a PWA-first system designed for small teams (1–25 employees) to track attendance and manage leaves with zero-trust security on the Firebase Free Tier.

**Goal**: Zero-cost, sub-second sync, and high reliability using Firebase Spark Plan.

## 2. Infrastructure & Directory Structure (Monorepo)
```text
/g/ATLAS/
├── apps/
│   └── web/                # Vite + React + TypeScript + PWA + Tailwind
├── packages/
│   └── shared/             # Shared Types, Zod Schemas, Domain Logic
├── firebase/               # Firebase Backend Config
│   ├── firestore.rules     # Strict RBAC (Zero-Trust)
│   ├── rtdb.rules          # For Real-time Presence/Concurrent Session control
│   └── firebase.json
├── docs/                   # Specs, Audits, Logs
└── package.json            # Root workspace config
```

## 3. Data Model (Firestore)

### `users` (Collection)
- `id`: `uid`
- `email`: string (registered by MD)
- `name`: string
- `role`: "employee" | "md"
- `status`: "active" | "archived"
- `currentDeviceId`: string | null (Session hijacking prevention)
- `lastLoginAt`: timestamp
- `deviceInfo`: object

### `attendance` (Collection)
- `id`: `YYYYMMDD_uid` (Deterministic for O(1) checks)
- `employeeId`: string
- `date`: string (YYYY-MM-DD)
- `status`: "pending" | "approved" | "rejected" | "absent"
- `selectionType`: "office" | "site"
- `siteId`: string | null (Historical: stores name if site deleted)
- `isOffDay`: boolean (Sunday or Holiday)
- `submissionCount`: number (Max 2)
- `rejectionReasonCode`: string
- `submittedAt`: timestamp
- `approvedAt`: timestamp

### `leave_applications` (Collection)
- `id`: auto-gen
- `employeeId`: string
- `fromDate`: string
- `toDate`: string
- `daysCount`: number
- `leaveType`: "earned" | "allotted"
- `isLop`: boolean (Loss of Pay)
- `status`: "pending" | "approved" | "rejected" | "cancelled" | "reversed"
- `employeeNote`: string
- `appliedAt`: timestamp

### `leave_balances` (Collection)
- `id`: `uid`
- `earned`: number
- `allotted`: number
- `updatedAt`: timestamp

### `leave_transactions` (Collection)
- `id`: auto-gen
- `employeeId`: string
- `type`: "credit" | "debit" | "reversal" | "adjustment"
- `leaveType`: "earned" | "allotted"
- `amount`: number
- `refId`: string (Attendance or Leave App ID)
- `createdAt`: timestamp

### `system_settings` (Collection)
- `id`: "global"
- `backdatingWindowDays`: number (default 7)
- `reminderTimeIst`: string (e.g., "21:00")
- `allottedLeaveCount`: number (granted to all)

## 4. Logical Workflows

### 4.1 Attendance & EL Credit
- **MD Submission**: Auto-sets `status: "approved"` on write via Security Rules or Client Logic (Rules preferred for integrity).
- **Sunday/Holiday Credit**: If `isOffDay == true` AND `status == "approved"`, a trigger/client-logic adds `+1` to `leave_balances/{uid}/earned`.

### 4.2 Leave Logic
- **Approval**: MD sets `status: "approved"`. Increments `debit` in `leave_transactions` and decrements `leave_balances`.
- **Reversal**: Restores balance and creates a `reversal` transaction.

### 4.3 Concurrent Session Prevention
- On login, client updates `users/{uid}/currentDeviceId`.
- Every Firestore listener/write checks if `localStorage.deviceId == currentDeviceId`.
- If mismatch, client clears local state and forces redirect to login.

## 5. Security Rules (Zero-Trust)
- **RBAC**: `request.auth.token.role` (Custom Claims) drives access.
- **Atomic Operations**: Balance updates and attendance marking must be atomic (Firestore Batches/Transactions).
- **Validation**: Rules enforce `submissionCount <= 2` and `date == today` for employees.

## 6. Retention & Archival
- **Live**: 365 days of `attendance` and `audit_logs`.
- **Archive**: Cloud Function (or manual script) exports docs to Firebase Storage as `.json.gz` and deletes from Firestore.
