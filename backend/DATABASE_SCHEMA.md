# ATLAS Firebase Database Schema - Simplified Attendance System

## Overview
This document defines the structure of the Firebase Realtime Database for the simplified ATLAS attendance system.

## Schema Structure

### 1. Employees Collection
**Path**: `/employees/{employeeId}`

```json
{
  "employees": {
    "uid_from_firebase_auth": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "Employee",
      "createdAt": "2025-11-20T10:00:00.000Z"
    }
  }
}
```

**Fields:**
- `employeeId` (key): Firebase Auth UID (unique identifier)
- `name`: Employee's display name
- `email`: Employee's email address
- `phone`: Employee's phone number (optional)
- `role`: "Employee" or "MD"
- `createdAt`: Timestamp when employee was created

---

### 2. Attendance Records Collection
**Path**: `/attendance/{attendanceId}`

```json
{
  "attendance": {
    "att_1732187400000_uid123": {
      "employeeId": "uid_from_firebase_auth",
      "employeeName": "John Doe",
      "employeeEmail": "john@example.com",
      "type": "Office",
      "siteName": null,
      "status": "Pending",
      "markedAt": "2025-11-21T09:15:00.000Z",
      "date": "2025-11-21",
      "isEdited": false,
      "originalData": null,
      "editedAt": null,
      "approvedBy": null,
      "approvedAt": null,
      "rejectedBy": null,
      "rejectedAt": null
    },
    "att_1732187500000_uid456": {
      "employeeId": "uid_from_firebase_auth_2",
      "employeeName": "Jane Smith",
      "employeeEmail": "jane@example.com",
      "type": "Site",
      "siteName": "Construction Site A",
      "status": "Approved",
      "markedAt": "2025-11-21T09:20:00.000Z",
      "date": "2025-11-21",
      "isEdited": true,
      "originalData": {
        "type": "Office",
        "siteName": null,
        "markedAt": "2025-11-21T09:20:00.000Z"
      },
      "editedAt": "2025-11-21T10:00:00.000Z",
      "approvedBy": "md_uid_123",
      "approvedAt": "2025-11-21T11:00:00.000Z",
      "rejectedBy": null,
      "rejectedAt": null
    }
  }
}
```

**Fields:**
- `attendanceId` (key): Format: `att_{timestamp}_{employeeId}`
- `employeeId`: Firebase Auth UID (unique employee identifier)
- `employeeName`: Employee's name (for quick display)
- `employeeEmail`: Employee's email (for quick display)
- `type`: "Office" or "Site"
- `siteName`: Name of the site (null if type is "Office")
- `status`: "Pending", "Approved", or "Rejected"
- `markedAt`: Timestamp when attendance was first marked
- `date`: Date in YYYY-MM-DD format (for easy querying)
- `isEdited`: Boolean - true if attendance was edited
- `originalData`: Object containing original values before edit (null if not edited)
  - `type`: Original type
  - `siteName`: Original site name
  - `markedAt`: Original timestamp
- `editedAt`: Timestamp when attendance was edited (null if not edited)
- `approvedBy`: UID of MD who approved (null if not approved)
- `approvedAt`: Timestamp when approved (null if not approved)
- `rejectedBy`: UID of MD who rejected (null if not rejected)
- `rejectedAt`: Timestamp when rejected (null if not rejected)

---

### 3. Employee Attendance Index (for quick queries)
**Path**: `/employee_attendance/{employeeId}/{date}`

```json
{
  "employee_attendance": {
    "uid_from_firebase_auth": {
      "2025-11-21": "att_1732187400000_uid123",
      "2025-11-20": "att_1732101000000_uid123",
      "2025-11-19": "att_1732014600000_uid123"
    }
  }
}
```

**Purpose:** Quick lookup to check if employee has marked attendance for a specific date.
**Value:** Points to the attendance record ID in `/attendance/{attendanceId}`

---

### 4. Pending Approvals Index (for MD)
**Path**: `/pending_approvals/{attendanceId}`

```json
{
  "pending_approvals": {
    "att_1732187400000_uid123": true,
    "att_1732187500000_uid456": true
  }
}
```

**Purpose:** Quick lookup for MD to see all pending attendance approvals.
**Value:** `true` if pending, removed when approved/rejected.

---

## API Endpoints

### Attendance Endpoints

#### 1. Mark Attendance
**POST** `/api/attendance/mark`

**Request Body:**
```json
{
  "employeeId": "uid_from_firebase_auth",
  "type": "Office",
  "siteName": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully. Pending MD approval.",
  "data": {
    "attendanceId": "att_1732187400000_uid123",
    "status": "Pending"
  }
}
```

---

#### 2. Edit Attendance
**PUT** `/api/attendance/edit/:attendanceId`

**Request Body:**
```json
{
  "type": "Site",
  "siteName": "Construction Site B"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance updated successfully.",
  "data": {
    "attendanceId": "att_1732187400000_uid123",
    "isEdited": true
  }
}
```

---

#### 3. Get Today's Attendance
**GET** `/api/attendance/today?employeeId={uid}`

**Response:**
```json
{
  "success": true,
  "data": {
    "attendanceId": "att_1732187400000_uid123",
    "type": "Office",
    "siteName": null,
    "status": "Pending",
    "markedAt": "2025-11-21T09:15:00.000Z",
    "isEdited": false
  }
}
```

---

#### 4. Get My Attendance History
**GET** `/api/attendance/my?employeeId={uid}&startDate={date}&endDate={date}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "attendanceId": "att_1732187400000_uid123",
      "date": "2025-11-21",
      "type": "Office",
      "siteName": null,
      "status": "Pending",
      "markedAt": "2025-11-21T09:15:00.000Z",
      "isEdited": false
    }
  ]
}
```

---

#### 5. Get Pending Approvals (MD Only)
**GET** `/api/attendance/pending`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "attendanceId": "att_1732187400000_uid123",
      "employeeId": "uid_from_firebase_auth",
      "employeeName": "John Doe",
      "employeeEmail": "john@example.com",
      "date": "2025-11-21",
      "type": "Office",
      "siteName": null,
      "status": "Pending",
      "markedAt": "2025-11-21T09:15:00.000Z",
      "isEdited": false,
      "originalData": null
    }
  ]
}
```

---

#### 6. Approve Attendance (MD Only)
**PUT** `/api/attendance/approve/:attendanceId`

**Request Body:**
```json
{
  "approvedBy": "md_uid_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance approved successfully."
}
```

---

#### 7. Reject Attendance (MD Only)
**PUT** `/api/attendance/reject/:attendanceId`

**Request Body:**
```json
{
  "rejectedBy": "md_uid_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance rejected successfully."
}
```

---

## Firebase Security Rules

```json
{
  "rules": {
    "employees": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid == $uid || root.child('employees').child(auth.uid).child('role').val() == 'MD')"
      }
    },
    "attendance": {
      ".read": "auth != null",
      "$attendanceId": {
        ".write": "auth != null"
      }
    },
    "employee_attendance": {
      "$employeeId": {
        ".read": "auth != null && (auth.uid == $employeeId || root.child('employees').child(auth.uid).child('role').val() == 'MD')",
        ".write": "auth != null && auth.uid == $employeeId"
      }
    },
    "pending_approvals": {
      ".read": "auth != null && root.child('employees').child(auth.uid).child('role').val() == 'MD'",
      ".write": "auth != null"
    }
  }
}
```

---

## Data Flow

### Employee Marks Attendance:
1. Employee submits type (Office/Site) and optional siteName
2. Backend creates attendance record with:
   - Unique ID: `att_{timestamp}_{employeeId}`
   - Employee ID from Firebase Auth
   - Current timestamp
   - Status: "Pending"
3. Add to `/attendance/{attendanceId}`
4. Add to `/employee_attendance/{employeeId}/{date}` for quick lookup
5. Add to `/pending_approvals/{attendanceId}` for MD

### Employee Edits Attendance:
1. Employee can only edit if status is "Pending"
2. Backend stores original data in `originalData` field
3. Updates `isEdited` to true
4. Updates `editedAt` timestamp
5. Keeps status as "Pending"

### MD Approves/Rejects:
1. MD views pending approvals from `/pending_approvals`
2. MD can see original vs edited data
3. On approve:
   - Update `status` to "Approved"
   - Set `approvedBy` and `approvedAt`
   - Remove from `/pending_approvals`
4. On reject:
   - Update `status` to "Rejected"
   - Set `rejectedBy` and `rejectedAt`
   - Remove from `/pending_approvals`

---

## Example Queries

### Check if employee marked attendance today:
```
GET /employee_attendance/{employeeId}/{today's date}
```

### Get all pending approvals:
```
GET /pending_approvals
```

### Get employee's attendance for a month:
```
GET /employee_attendance/{employeeId}
Filter by date range
```
