# ATLAS - Feature Development Documentation

This document explains all the features we've built for ATLAS in both simple and technical terms.

---

## 1. Employee Authentication & Role-Based Access

### Simple Explanation
Like logging into your email, employees can sign in using Google or phone number. Once logged in, the system automatically knows if you're a regular employee or an MD (Managing Director), and shows you the right pages.

### How It Works (Simple)
1. Employee clicks "Sign in with Google" or enters phone number
2. System verifies the login
3. System checks if the email is in the "MD list" or "Employee list"
4. Based on the list, you see either the MD dashboard or Employee dashboard

### Technical Implementation
- **Technologies**: Firebase Authentication (Google Sign-In, Phone Auth)
- **Files**:
  - `frontend/src/context/AuthContext.jsx` - Handles login, logout, and role assignment
  - `frontend/src/config/mdList.js` - List of MD emails
  - `frontend/src/config/employeeList.js` - List of employee emails
  - `frontend/src/config/firebase.js` - Firebase SDK initialization

**Code Flow:**
```javascript
// AuthContext.jsx
const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
};

// Role assignment
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            let role = 'Employee';
            if (mdEmails.includes(user.email)) {
                role = 'MD';
            } else if (employeeEmails.includes(user.email)) {
                role = 'Employee';
            }
            user.role = role;
        }
        setCurrentUser(user);
    });
    return unsubscribe;
}, []);
```

**Why This Approach:**
- Simple to maintain (just update email lists)
- No complex permission system needed for small team
- Firebase handles all security

---

## 2. Attendance Marking

### Simple Explanation
Employees can mark their attendance each day by selecting whether they're working from the office or at a site. If they're at a site, they enter the site name. The attendance is sent to the MD for approval.

### How It Works (Simple)
1. Employee opens "Mark Attendance" page
2. Chooses "Office" or "Site"
3. If "Site", types the site name
4. Clicks "Mark Attendance"
5. Attendance is saved as "Pending" waiting for MD approval

### Technical Implementation
- **Frontend**: `frontend/src/pages/MarkAttendance.jsx`
- **Backend**: `backend/controllers/attendanceController.js` → `markAttendance` function
- **Database**: Firebase Realtime Database
- **API**: `POST /api/attendance/mark`

**Database Structure:**
```
attendance/
  att_1763818900934_AcT5TLl.../
    employeeId: "AcT5TLl..."
    employeeName: "Aditya Chavan"
    type: "Office" | "Site"
    siteName: "Site A" | null
    status: "Pending"
    markedAt: "2024-11-22T09:30:00Z"
    date: "2024-11-22"

employee_attendance/
  AcT5TLl.../
    2024-11-22: "att_1763818900934_AcT5TLl..."

pending_approvals/
  att_1763818900934_AcT5TLl...: true
```

**Validation Rules:**
- ✅ One attendance per day per employee
- ✅ Site name required if type is "Site"
- ✅ Employee record must exist in database

---

## 3. Edit Attendance (Before Approval)

### Simple Explanation
If you marked attendance but made a mistake (wrong site name or chose Site instead of Office), you can edit it **before the MD approves it**. You cannot edit after approval.

### How It Works (Simple)
1. Employee marks attendance (status: Pending)
2. Realizes there's a mistake
3. Clicks "Edit Attendance" button
4. Changes the type or site name
5. Saves - the original data is stored for audit trail

### Technical Implementation
- **Frontend**: Same `MarkAttendance.jsx` component, edit mode
- **Backend**: `editAttendance` function
- **API**: `PUT /api/attendance/edit/:attendanceId`

**Edit Logic:**
```javascript
// Only allow edit if status is Pending
if (attendanceData.status !== 'Pending') {
    return res.status(400).json({
        message: `Cannot edit. Status is already ${attendanceData.status}`
    });
}

// Preserve original data
const originalData = attendanceData.isEdited
    ? attendanceData.originalData
    : {
        type: attendanceData.type,
        siteName: attendanceData.siteName,
        markedAt: attendanceData.markedAt
    };

// Update with new data
const updates = {
    type,
    siteName: type === 'Site' ? siteName : null,
    isEdited: true,
    originalData,
    editedAt: new Date().toISOString()
};
```

**Audit Trail:**
- Original data is preserved in `originalData` field
- `isEdited` flag is set to `true`
- `editedAt` timestamp records when the edit happened

---

## 4. MD Attendance Approval Dashboard

### Simple Explanation
The MD sees a list of all pending attendance requests. For each request, they can see:
- Employee name
- Time they marked attendance (e.g., "9:02 PM")
- Whether they're at Office or Site
- Approve or Reject buttons

### How It Works (Simple)
1. MD logs in and goes to Dashboard
2. Sees count of pending approvals
3. Clicks "Review Approvals"
4. Sees list of all pending attendance
5. Clicks "Approve" or "Reject" for each one
6. Employee sees status update

### Technical Implementation
- **Frontend**: 
  - `frontend/src/pages/Dashboard.jsx` - Shows pending count
  - `frontend/src/pages/AttendanceApproval.jsx` - Approval interface
- **Backend**: 
  - `getPendingApprovals` - Fetches all pending
  - `approveAttendance` - Updates status to Approved
  - `rejectAttendance` - Updates status to Rejected

**Approval Flow:**
```javascript
// Backend: approveAttendance
const updates = {};
updates[`attendance/${attendanceId}/status`] = 'Approved';
updates[`attendance/${attendanceId}/approvedBy`] = mdId;
updates[`attendance/${attendanceId}/approvedAt`] = timestamp;
updates[`pending_approvals/${attendanceId}`] = null; // Remove from pending

await db.ref().update(updates);
```

**UI Features:**
- 12-hour time format (e.g., "9:02 PM" instead of "09:02")
- Combined location display: "🏢 Office" or "🏗️ Site: Site Name"
- Shows if attendance was edited (with "Edited" badge)

---

## 5. Re-marking After Rejection

### Simple Explanation
If the MD rejects your attendance (maybe you marked wrong site), you can mark it again the same day. The old rejected record is automatically deleted and you can create a fresh one. A special "Remark Attendance" button appears right on your dashboard to make this easy.

### How It Works (Simple)
1. MD rejects attendance
2. Employee sees "Rejected" status on the Dashboard
3. A bright "🔄 Remark Attendance" button appears next to the status
4. Employee clicks the button → taken to marking page
5. Old rejected record is automatically deleted
6. Employee can mark fresh attendance

### Technical Implementation
- **Backend**: Modified `markAttendance` to check existing attendance status
- **Frontend**: 
  - `Dashboard.jsx` - Shows "Remark Attendance" button for rejected status
  - `MarkAttendance.jsx` - Shows form instead of "Already Marked" view when status is rejected

**UI Enhancement:**
```javascript
// Dashboard.jsx - Shows button only for rejected attendance
{todayAttendance.status === 'Rejected' && (
    <Button
        variant="primary"
        onClick={() => navigate('/attendance/mark')}
        className="w-full mt-md"
    >
        🔄 Remark Attendance
    </Button>
)}
```

**Rejection Handling:**
```javascript
// Check if attendance exists
if (todaySnapshot.exists()) {
    const existingAttendance = await getAttendanceRecord(existingAttendanceId);
    
    // If rejected, allow re-marking by deleting old record
    if (existingAttendance.status === 'Rejected') {
        console.log(`[Attendance] Deleting rejected attendance ${existingAttendanceId} to allow re-marking`);
        const deleteUpdates = {};
        deleteUpdates[`attendance/${existingAttendanceId}`] = null;
        deleteUpdates[`employee_attendance/${employeeId}/${date}`] = null;
        await db.ref().update(deleteUpdates);
        // Continue to create new attendance
    } else {
        // Block duplicate if Pending or Approved
        return res.status(400).json({
            message: `Attendance already marked and is ${status}`
        });
    }
}
```

**User Experience:**
- ✅ One-click access to re-mark from Dashboard
- ✅ No need to navigate through menus
- ✅ Clear visual indication with button color
- ✅ Automatic cleanup of old rejected record

---

## 6. Real-Time Updates Without Manual Refresh

### Simple Explanation
Instead of requiring the MD or employees to manually refresh the page to see new attendance requests or status updates, the app automatically "checks for updates" every few seconds in the background, similar to how your email app checks for new messages.

### How It Works (Simple)
1. **For MD Dashboard**: Every 10 seconds, the app automatically asks "Are there any new pending approvals?"
2. **For Attendance Approval Page**: Every 5 seconds, the app fetches the latest list of pending requests
3. When an employee marks attendance, the MD sees it appear within 5-10 seconds
4. When MD approves/rejects, the employee sees the status update within 10 seconds

### Technical Implementation
- **Technology**: JavaScript `setInterval()` for polling
- **Pattern**: Client-side polling (periodic HTTP requests)
- **Files Modified**:
  - `frontend/src/pages/AttendanceApproval.jsx` - Auto-refresh every 5 seconds
  - `frontend/src/pages/Dashboard.jsx` - Auto-refresh every 10 seconds

**Code Implementation:**
```javascript
useEffect(() => {
    fetchPendingApprovals(); // Initial fetch
    
    // Auto-refresh interval
    const interval = setInterval(() => {
        fetchPendingApprovals(); // Fetch updates every 5 seconds
    }, 5000);
    
    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
}, []);
```

**Why Polling Instead of WebSockets:**
- **Pros**:
  - Simple to implement
  - Works with existing REST API (no WebSocket setup needed)
  - Reliable - doesn't depend on persistent connections
  - Easy to debug and maintain
- **Cons**:
  - Not truly "instant" (5-10 second delay)
  - Creates periodic HTTP requests (acceptable for small teams)

**Alternative Approaches Considered:**
1. **Firebase Realtime Database Listeners**: Instant updates but requires Firebase SDK integration
2. **WebSockets**: True real-time but adds complexity
3. **Server-Sent Events (SSE)**: One-way real-time but overkill

**Trade-offs:**
For ATLAS's scale (small team, low traffic), polling every 5-10 seconds provides excellent UX without the complexity of WebSockets or Firebase listeners.

---

## Summary of Features

| Feature | Employee Can | MD Can | Status |
|---------|-------------|---------|---------|
| Login with Google/Phone | ✅ | ✅ | Complete |
| Mark Attendance (Office/Site) | ✅ | ❌ | Complete |
| Edit Pending Attendance | ✅ | ❌ | Complete |
| View Approval Status | ✅ | ❌ | Complete |
| Re-mark After Rejection | ✅ | ❌ | Complete |
| Approve/Reject Attendance | ❌ | ✅ | Complete |
| Real-Time Dashboard Updates | ✅ | ✅ | Complete |
| View Pending Count | ❌ | ✅ | Complete |

---

## Technology Stack

**Frontend:**
- React 18
- Vite
- Firebase Auth SDK
- Axios (HTTP client)
- React Router

**Backend:**
- Node.js + Express
- Firebase Admin SDK
- Firebase Realtime Database
- CORS enabled

**Authentication:**
- Firebase Authentication (Google, Phone)
- JWT tokens (Firebase ID tokens)

**Database:**
- Firebase Realtime Database (NoSQL)
