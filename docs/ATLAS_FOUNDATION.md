# ATLAS v2: Foundation Document

> **Status**: 🔒 **LOCKED** - Implementation Rulebook  
> **Company Size**: 10-12 employees  
> **Philosophy**: Trust-based, not surveillance  
> **Version**: 2.0.0  
> **Last Updated**: 2026-01-04

---

## Document Purpose

This is the **single source of truth** for ATLAS v2 architecture and implementation rules.

**Rules**:
1. ✅ All implementation MUST follow this document
2. ✅ Any changes require formal review and update
3. ✅ When in doubt, refer to this document

---

# Table of Contents

1. [Business Context](#1-business-context)
2. [Core Requirements](#2-core-requirements)
3. [System Architecture](#3-system-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Workflows](#5-workflows)
6. [Notification Strategy](#6-notification-strategy)
7. [Development Standards](#7-development-standards)
8. [Implementation Rules](#8-implementation-rules)

---

# 1. Business Context

## 1.1 Company Profile

- **Size**: 10-12 employees
- **Industry**: Construction/Field Services
- **Management**: MD knows all employees personally
- **Trust Model**: High-trust environment, no surveillance needed

## 1.2 Core Purpose

**ATLAS answers**: *"Did Employee X work on Date Y?"*

**For**:
- Payroll processing (monthly)
- Client billing (labor hours)
- Basic attendance tracking

**NOT for**:
- Employee surveillance
- Location tracking
- Productivity monitoring
- Task management

## 1.3 Key Principle

> **Trust-Based System**: We trust employees to report honestly. MD approval is the verification mechanism, not GPS or surveillance technology.

---

# 2. Core Requirements

## 2.1 Must Have (Non-Negotiable)

### ✅ 100% Uptime
- **Target**: 99.9% availability
- **Solution**: Firebase (Google infrastructure)
- **Monitoring**: Firebase uptime dashboard

### ✅ Quick Attendance Marking
- **Target**: <3 seconds from click to confirmation
- **Flow**: Select location → Click "Send for Approval" → Done
- **No**: GPS verification, photo capture, or complex forms

### ✅ Real-Time Synchronization
- **Requirement**: All users see updates instantly
- **Solution**: Firestore real-time listeners
- **No**: Manual refresh needed

### ✅ Approval Workflow
- **Rule**: NO auto-approval
- **Flow**: Employee marks → Pending → MD approves/rejects
- **Control**: MD approval is the single source of truth

### ✅ Offline Support
- **Requirement**: Work without internet, sync when back online
- **Timestamp**: Use marked time (not sync time)
- **Queue**: Store in IndexedDB, process when online

## 2.2 Core Features

### Attendance Marking
```
Employee Flow:
1. Click "Mark Attendance"
2. Select location: "Office" or "Site Name" (dropdown)
3. Click "Send for Approval"
4. Status: "Pending Approval"
5. Wait for MD approval
```

### Leave Management
```
Leave Types:
1. Leave (default) - Regular leave requests
2. Earned Leave - Auto-added when MD approves Sunday work

Employee Flow:
1. Apply for leave (dates + reason)
2. Status: "Pending"
3. MD approves/rejects
4. If approved: Leave balance updated
```

### MD Approval
```
MD Flow:
1. Receive notification when attendance marked
2. Review pending approvals (bulk view)
3. Select multiple entries
4. Click "Approve Selected" or "Reject Selected"
5. For rejection: Provide reason (mandatory)
```

### Notifications
```
Employee Notifications:
- 11:00 AM: "Reminder: Mark your attendance"
- 5:00 PM: "Reminder: Mark your attendance" (if not marked)
- On approval: "Your attendance was approved"
- On rejection: "Your attendance was rejected - Reason: [MD comment]"

MD Notifications:
- Real-time: "John Doe marked attendance" (with sound)
- 5:00 PM: "You have X pending approvals" (if any pending)
```

---

# 3. System Architecture

## 3.1 Technology Stack

### Frontend
```yaml
Framework: React 19
Build Tool: Vite 7
Language: TypeScript (strict mode)
Styling: Tailwind CSS 3.4
State Management:
  Server State: TanStack Query v5 (real-time sync)
  Client State: Zustand v5 (UI state, offline queue)
Routing: React Router v7
Icons: Lucide React
PWA: Vite PWA Plugin (offline support)
```

### Backend
```yaml
Database: Firebase Firestore (real-time NoSQL)
Authentication: Firebase Auth (Google Sign-In)
Functions: Firebase Cloud Functions (Node.js 20)
  - Excel export generation
  - Push notifications (FCM)
  - Earned leave calculation
Hosting: Firebase Hosting (frontend)
```

### Why This Stack?
- ✅ **Firebase**: 99.95% uptime SLA, real-time sync built-in
- ✅ **TypeScript**: Catch errors at compile time
- ✅ **TanStack Query**: Automatic real-time updates, caching
- ✅ **Lightweight**: No heavy frameworks, fast load times

## 3.2 Architecture Pattern

**Pattern**: Simplified 3-Layer Architecture

```
┌─────────────────────────────────────┐
│     PRESENTATION LAYER              │
│  React Components + Hooks           │
│  - AttendancePage                   │
│  - ApprovalPage (MD)                │
│  - LeavePage                        │
└─────────────────────────────────────┘
              ↕ TanStack Query
┌─────────────────────────────────────┐
│     SERVICE LAYER                   │
│  Business Logic (TypeScript)        │
│  - AttendanceService                │
│  - LeaveService                     │
│  - NotificationService              │
└─────────────────────────────────────┘
              ↕ Firebase SDK
┌─────────────────────────────────────┐
│     DATA LAYER                      │
│  Firestore Collections              │
│  - /users                           │
│  - /attendance                      │
│  - /leaves                          │
│  - /notifications                   │
└─────────────────────────────────────┘
```

**Why Simplified?**
- Small team (10-12 people)
- Simple domain (attendance + leaves)
- No need for complex microservices

---

# 4. Data Architecture

## 4.1 Core Principles

### Principle 1: UTC Timestamps
**Rule**: All timestamps in ISO-8601 UTC format  
**Display**: Convert to IST for UI only

```typescript
// ✅ CORRECT
const timestamp = new Date().toISOString(); // "2026-01-04T10:30:00.000Z"

// ❌ WRONG
const timestamp = Date.now(); // Ambiguous
```

### Principle 2: Simple Schema
**Rule**: Keep data structure flat and simple  
**No**: Over-normalization, complex joins

### Principle 3: Real-Time First
**Rule**: Use Firestore real-time listeners  
**No**: Polling or manual refresh

## 4.2 Database Schema

### Collection: `/users/{uid}`
```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;                  // Google email
  name: string;                   // Display name
  role: 'employee' | 'md';        // Role
  leave_balance: number;          // Regular leave days
  earned_leave_balance: number;   // Earned leave days
  fcm_token: string | null;       // For push notifications
  created_at: string;             // ISO-8601 UTC
  updated_at: string;
}
```

### Collection: `/attendance/{recordId}`
```typescript
interface AttendanceRecord {
  id: string;                     // Auto-generated
  employee_uid: string;           // Who marked it
  employee_name: string;          // Denormalized for display
  date: string;                   // YYYY-MM-DD (for querying)
  location: string;               // "Office" or "KTFL Site" etc.
  
  marked_at: string;              // ISO-8601 UTC (when employee clicked)
  synced_at: string | null;       // ISO-8601 UTC (when reached server)
  
  status: 'pending' | 'approved' | 'rejected';
  
  // Approval metadata
  reviewed_by: string | null;     // MD uid
  reviewed_at: string | null;     // ISO-8601 UTC
  rejection_reason: string | null; // Mandatory if rejected
  
  // Earned leave flag
  is_holiday_work: boolean;       // True if approved on Sunday
  earned_leave_granted: boolean;  // True if earned leave added
  
  created_at: string;
  updated_at: string;
}
```

### Collection: `/leaves/{leaveId}`
```typescript
interface LeaveRequest {
  id: string;
  employee_uid: string;
  employee_name: string;          // Denormalized
  
  start_date: string;             // YYYY-MM-DD
  end_date: string;               // YYYY-MM-DD
  total_days: number;             // Calculated
  reason: string;
  leave_type: 'leave' | 'earned_leave';
  
  status: 'pending' | 'approved' | 'rejected';
  
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  
  created_at: string;
  updated_at: string;
}
```

### Collection: `/sites`
```typescript
interface Site {
  id: string;
  name: string;                   // "KTFL Chakan", "Office", etc.
  status: 'active' | 'inactive';
  created_at: string;
}
```

### Collection: `/notifications/{notificationId}`
```typescript
interface Notification {
  id: string;
  recipient_uid: string;          // Who receives it
  type: 'attendance_marked' | 'attendance_approved' | 'attendance_rejected' 
       | 'leave_approved' | 'leave_rejected' | 'reminder';
  title: string;
  body: string;
  data: Record<string, any>;      // Additional context
  read: boolean;
  created_at: string;
}
```

## 4.3 State Management

### Server State (TanStack Query)
**Purpose**: Sync Firestore data with UI

```typescript
// Real-time attendance updates
function useAttendance(date: string) {
  return useQuery({
    queryKey: ['attendance', date],
    queryFn: () => {
      // Firestore real-time listener
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          query(collection(db, 'attendance'), where('date', '==', date)),
          (snapshot) => {
            resolve(snapshot.docs.map(doc => doc.data()));
          }
        );
      });
    },
    staleTime: Infinity, // Real-time, never stale
  });
}
```

### Client State (Zustand)
**Purpose**: UI state and offline queue

```typescript
interface AppStore {
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Offline Queue
  offlineQueue: PendingAction[];
  addToQueue: (action: PendingAction) => void;
  processQueue: () => Promise<void>;
}
```

## 4.4 Offline Strategy

### Offline Queue (IndexedDB)
```typescript
interface PendingAction {
  id: string;
  type: 'MARK_ATTENDANCE' | 'APPLY_LEAVE';
  payload: any;
  marked_at: string;              // Original timestamp (CRITICAL)
  retry_count: number;
  max_retries: 3;
}
```

### Sync Logic
```typescript
// When back online
async function syncOfflineQueue() {
  const queue = await getOfflineQueue();
  
  for (const action of queue) {
    try {
      // Use original marked_at timestamp, not current time
      await executeAction({
        ...action.payload,
        marked_at: action.marked_at  // Preserve original time
      });
      await removeFromQueue(action.id);
    } catch (error) {
      if (action.retry_count < action.max_retries) {
        await incrementRetryCount(action.id);
      } else {
        // Show error to user
        await flagForManualReview(action);
      }
    }
  }
}
```

---

# 5. Workflows

## 5.1 Attendance Marking Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ EMPLOYEE: Mark Attendance                                   │
└─────────────────────────────────────────────────────────────┘
  1. Click "Mark Attendance" button
  2. Select location from dropdown:
     - "Office"
     - "KTFL Chakan"
     - "Other Site" (dynamic list from /sites)
  3. Click "Send for Approval"
  4. System records:
     - marked_at: Current timestamp (ISO-8601 UTC)
     - status: "pending"
  5. If offline:
     - Save to IndexedDB with marked_at timestamp
     - Show: "Saved offline, will sync when online"
  6. If online:
     - Write to Firestore immediately
     - Trigger MD notification (real-time)
  7. Show success: "Attendance sent for approval"

┌─────────────────────────────────────────────────────────────┐
│ MD: Approve/Reject                                          │
└─────────────────────────────────────────────────────────────┘
  1. Receive push notification (with sound):
     "John Doe marked attendance at Office"
  2. Open approval page
  3. See pending list:
     ☑ John Doe - Office - 9:00 AM
     ☑ Jane Smith - KTFL Site - 8:45 AM
  4. Select entries (bulk)
  5. Click "Approve Selected" or "Reject Selected"
  6. If rejecting:
     - Modal: "Rejection Reason" (required)
     - Enter reason: "Wrong location" / "Not present" etc.
  7. System updates:
     - status: "approved" or "rejected"
     - reviewed_by: MD uid
     - reviewed_at: Current timestamp
     - rejection_reason: (if rejected)
  8. If approved on Sunday:
     - is_holiday_work: true
     - earned_leave_granted: true
     - User.earned_leave_balance += 1
  9. Trigger employee notification

┌─────────────────────────────────────────────────────────────┐
│ EMPLOYEE: Receive Result                                    │
└─────────────────────────────────────────────────────────────┘
  1. Receive push notification:
     - "Your attendance was approved ✓"
     - OR "Your attendance was rejected - Reason: [MD comment]"
  2. Dashboard updates in real-time (no refresh)
  3. If rejected:
     - Can mark attendance again (corrected)
```

## 5.2 Leave Application Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ EMPLOYEE: Apply for Leave                                   │
└─────────────────────────────────────────────────────────────┘
  1. Click "Apply for Leave"
  2. Fill form:
     - Start Date (date picker)
     - End Date (date picker)
     - Leave Type: "Leave" or "Earned Leave" (dropdown)
     - Reason (text area)
  3. System calculates:
     - total_days = (end_date - start_date) + 1
  4. Validate:
     - If "Leave": Check leave_balance >= total_days
     - If "Earned Leave": Check earned_leave_balance >= total_days
  5. Click "Submit"
  6. System records:
     - status: "pending"
  7. Show success: "Leave request submitted"

┌─────────────────────────────────────────────────────────────┐
│ MD: Approve/Reject Leave                                    │
└─────────────────────────────────────────────────────────────┘
  1. See pending leave requests
  2. Review:
     - Employee name
     - Dates (start to end)
     - Total days
     - Reason
  3. Click "Approve" or "Reject"
  4. If rejecting: Enter reason
  5. System updates:
     - status: "approved" or "rejected"
     - If approved: Deduct from leave balance
  6. Trigger employee notification
```

## 5.3 Duplicate Prevention

**Rule**: One attendance per employee per day

```typescript
// Before marking attendance
const existingAttendance = await getAttendance(employee_uid, date);

if (existingAttendance) {
  if (existingAttendance.status === 'pending') {
    throw new Error('You already have a pending attendance for today');
  }
  if (existingAttendance.status === 'approved') {
    throw new Error('Your attendance for today is already approved');
  }
  if (existingAttendance.status === 'rejected') {
    // Allow re-submission after rejection
    // Delete old rejected entry, create new one
  }
}
```

---

# 6. Notification Strategy

## 6.1 Employee Notifications

### Daily Reminders
```
11:00 AM IST:
  Title: "Mark Your Attendance"
  Body: "Don't forget to mark your attendance for today"
  Action: Opens app to attendance page

5:00 PM IST (if not marked):
  Title: "Attendance Reminder"
  Body: "You haven't marked attendance yet"
  Action: Opens app to attendance page
```

### Approval Results
```
On Approval:
  Title: "Attendance Approved ✓"
  Body: "Your attendance for [date] at [location] was approved"
  
On Rejection:
  Title: "Attendance Rejected"
  Body: "Reason: [MD's rejection reason]"
  Action: Opens app to mark again
```

### Leave Results
```
On Approval:
  Title: "Leave Approved ✓"
  Body: "Your leave from [start] to [end] was approved"
  
On Rejection:
  Title: "Leave Rejected"
  Body: "Reason: [MD's rejection reason]"
```

## 6.2 MD Notifications

### Real-Time Attendance Alerts
```
When employee marks attendance:
  Title: "New Attendance"
  Body: "[Employee Name] marked attendance at [Location]"
  Sound: Enabled (CRITICAL - must be audible)
  Action: Opens approval page
  Priority: High
```

### Daily Summary
```
5:00 PM IST (if pending approvals exist):
  Title: "Pending Approvals"
  Body: "You have [X] attendance approvals pending"
  Action: Opens approval page
  Priority: Normal
```

## 6.3 Implementation (FCM)

```typescript
// Send notification
async function sendNotification(
  recipientUid: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }
) {
  const user = await getUser(recipientUid);
  
  if (!user.fcm_token) {
    console.warn('User has no FCM token');
    return;
  }
  
  await admin.messaging().send({
    token: user.fcm_token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data || {},
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'attendance_alerts',
      },
    },
    webpush: {
      notification: {
        requireInteraction: true, // Stay visible
      },
    },
  });
  
  // Also save to /notifications collection for in-app display
  await saveNotification(recipientUid, notification);
}
```

---

# 7. Development Standards

## 7.1 TypeScript Rules

**Strict Mode**: Enabled

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**ESLint Rules**:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

## 7.2 Code Organization

```
src/
  features/
    attendance/
      components/
        MarkAttendanceForm.tsx
        AttendanceHistory.tsx
      hooks/
        useAttendance.ts
      services/
        attendanceService.ts
      types/
        attendance.types.ts
      
    approval/
      components/
        ApprovalList.tsx
        BulkApprovalActions.tsx
      hooks/
        usePendingApprovals.ts
      services/
        approvalService.ts
        
    leave/
      components/
        LeaveApplicationForm.tsx
        LeaveHistory.tsx
      hooks/
        useLeaves.ts
      services/
        leaveService.ts
        
  shared/
    components/
      Button.tsx
      Input.tsx
      Modal.tsx
      DatePicker.tsx
    hooks/
      useAuth.ts
      useNotifications.ts
    utils/
      dateUtils.ts
      formatters.ts
      
  lib/
    firebase/
      config.ts
      firestore.ts
      auth.ts
      messaging.ts
```

## 7.3 Naming Conventions

```typescript
// Components: PascalCase
function MarkAttendanceForm() {}

// Hooks: camelCase with 'use' prefix
function useAttendance() {}

// Services: camelCase with 'Service' suffix
const attendanceService = {}

// Types/Interfaces: PascalCase
interface AttendanceRecord {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Files: 
// - Components: PascalCase.tsx
// - Hooks: camelCase.ts
// - Services: camelCase.ts
// - Types: camelCase.types.ts
```

## 7.4 Testing Strategy

**Coverage Target**: 70% (focus on critical paths)

```
Unit Tests (Vitest):
  - Services (business logic)
  - Utilities (pure functions)
  - Hooks (with React Testing Library)

Integration Tests:
  - Firebase Emulator Suite
  - API endpoints
  - Real-time listeners

E2E Tests (Playwright):
  - Mark attendance flow
  - Approval flow
  - Leave application flow
```

---

# 8. Implementation Rules

## 8.1 Development Workflow

```
1. Feature Branch
   git checkout -b feature/attendance-marking

2. Implement
   - Write code following this foundation
   - Add unit tests
   - Test manually

3. Pre-Commit Checks (Husky)
   - ESLint (no errors)
   - TypeScript compilation
   - Prettier formatting

4. Pull Request
   - CI runs all tests
   - Code review required
   - Merge to main

5. Deploy
   - Automatic deployment to Firebase
   - Verify in production
```

## 8.2 Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isMD() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'md';
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }
    
    // Users collection
    match /users/{uid} {
      allow read: if isOwner(uid) || isMD();
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Attendance collection
    match /attendance/{recordId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(request.resource.data.employee_uid);
      allow update: if isMD(); // Only MD can approve/reject
      allow delete: if false;
    }
    
    // Leaves collection
    match /leaves/{leaveId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(request.resource.data.employee_uid);
      allow update: if isMD(); // Only MD can approve/reject
      allow delete: if false;
    }
    
    // Sites collection
    match /sites/{siteId} {
      allow read: if isAuthenticated();
      allow write: if isMD();
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.recipient_uid);
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

## 8.3 Error Handling

```typescript
// Standard error response
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
}

// Error codes
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
}

// Usage
try {
  await markAttendance(data);
} catch (error) {
  if (error.code === ErrorCode.DUPLICATE_ENTRY) {
    showToast('You already marked attendance today');
  } else {
    showToast('Something went wrong. Please try again.');
    logError(error); // Send to monitoring
  }
}
```

## 8.4 Performance Targets

```
Page Load: <2 seconds
Attendance Marking: <3 seconds
Real-time Update: <1 second
Offline Sync: <5 seconds after reconnection
```

---

# 9. Excel Export Format

## 9.1 Requirements

**User will provide exact template**

**Placeholder structure**:
```
Sheet 1: Attendance Matrix
  - Rows: Employees
  - Columns: Dates (1-31)
  - Cells: 
    - "P" = Present (approved)
    - "L" = Leave
    - "H" = Holiday (Sunday)
    - Empty = Absent

Sheet 2: (If needed)
  - Additional metadata
  - Approval logs
  - Leave balance summary
```

**Implementation**: Cloud Function using ExcelJS

---

# 10. Success Criteria

## 10.1 Functional Requirements

- ✅ Employee can mark attendance in <3 seconds
- ✅ MD receives real-time notification with sound
- ✅ Bulk approval works for 10+ entries
- ✅ Offline attendance syncs with correct timestamp
- ✅ Earned leave auto-added for Sunday work
- ✅ Rejection requires reason
- ✅ Excel export matches user template

## 10.2 Non-Functional Requirements

- ✅ 99.9% uptime (Firebase SLA)
- ✅ Real-time updates (<1 second)
- ✅ Works offline (IndexedDB queue)
- ✅ Mobile responsive (PWA)
- ✅ Push notifications work reliably

## 10.3 User Experience

- ✅ Simple, intuitive UI
- ✅ No unnecessary clicks
- ✅ Clear feedback on all actions
- ✅ Fast, responsive, no lag

---

# Appendix: Decision Log

## Decision 1: No GPS Tracking
**Reason**: Small team (10-12), high trust, MD knows everyone  
**Alternative Considered**: GPS geofencing  
**Rejected Because**: Creates distrust, unnecessary for small team

## Decision 2: Approval Workflow
**Reason**: MD approval is verification mechanism  
**Alternative Considered**: Auto-approval with audit  
**Rejected Because**: User explicitly wants MD control

## Decision 3: Bulk Approval
**Reason**: Efficiency for MD (10-12 daily approvals)  
**Alternative Considered**: One-by-one approval  
**Rejected Because**: Too time-consuming

## Decision 4: Offline Timestamp Preservation
**Reason**: Fair to employees with poor connectivity  
**Alternative Considered**: Use sync time  
**Rejected Because**: Penalizes employees for network issues

## Decision 5: Earned Leave for Sundays
**Reason**: Simple rule, easy to automate  
**Alternative Considered**: Manual earned leave tracking  
**Rejected Because**: Automation reduces MD workload

---

# Document Status

**Version**: 2.0.0  
**Status**: 🔒 **LOCKED**  
**Last Updated**: 2026-01-04  
**Pending**: Excel template from user

**Next Step**: Begin implementation following this foundation
