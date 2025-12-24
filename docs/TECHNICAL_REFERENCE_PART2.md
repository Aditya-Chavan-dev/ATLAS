# ATLAS: Technical Reference Manual - Part 2

**Continuation from Part 1**  
**Sections**: 7-10 (Approval, Notifications, Leave, Export)  
**Last Updated**: December 2025  
**Version**: 1.0

---

## 7. MD Approval Workflow

### Frontend: `src/md/pages/Approvals.jsx`

**Purpose**: MD portal for reviewing and approving/rejecting attendance and leave requests

#### Component State Management

**Lines 20-30: State Initialization**

```javascript
export default function MDApprovals() {
    const { userProfile, currentUser } = useAuth()           // L21: MD user context
    const [approvals, setApprovals] = useState([])           // L22: Combined attendance + leave requests
    const [loading, setLoading] = useState(true)              // L23: Initial data fetch
    const [processingId, setProcessingId] = useState(null)    // L24: Disable buttons during API call
    const [filter, setFilter] = useState('pending')          // L25: 'pending' | 'history'
    const [toast, setToast] = useState(null)                 // L26: Success/error messages
    
    // L29-30: Modal state for confirmation dialogs
    const [rejectModal, setRejectModal] = useState({ isOpen: false, item: null, reason: '' })
    const [approveModal, setApproveModal] = useState({ isOpen: false, item: null })
```

💡 **Design Pattern**: Single state array for mixed request types (attendance + leave) with `reqType` discriminator

#### Real-Time Data Fetching

**Lines 33-90: Combined Listener**

```javascript
useEffect(() => {
    const usersRef = ref(database, 'employees')    // L36: Listen to entire employees tree
    const leavesRef = ref(database, 'leaves')       // L37: Listen to entire leaves tree
    
    let rawUsers = {}    // L41: Closure variables to merge snapshots
    let rawLeaves = {}
    
    // L44-84: Update function called when either snapshot changes
    const updateData = () => {
        const attItems = []  // L45: Accumulator for attendance requests
        
        // L46-61: Extract attendance records from employees tree
        Object.entries(rawUsers).forEach(([uid, userData]) => {
            const attendanceRecords = userData.attendance || {}
            Object.entries(attendanceRecords).forEach(([date, record]) => {
                // L49: Check if status is pending type
                const isPending = ['pending', 'correction_pending', 'edit_pending', 'pending_co']
                                   .includes(record.status)
                
                attItems.push({
                    id: date,                             // L51: Unique ID for React key
                    employeeUid: uid,                     // L52: For API call
                    date,
                    ...record,                            // L54: Spread all attendance fields
                    reqType: 'attendance',                // L55: Discriminator
                    employeeName: record.employeeName || userData.name || userData.email,  // L56: Fallback chain
                    employeeEmail: record.employeeEmail || userData.email,
                    isPending                             // L58: For filtering
                })
            })
        })
```

💡 **Optimization Opportunity**: Currently loads ALL employees and ALL attendance records into memory. Should implement pagination or filtering at query level for organizations >100 employees.

```javascript
        // L63-76: Extract leave requests
        const leaveItems = []
        Object.entries(rawLeaves).forEach(([uid, userLeaves]) => {
            Object.entries(userLeaves).forEach(([leaveId, leave]) => {
                const isPending = leave.status === 'pending' || leave.status === 'auto-blocked'
                leaveItems.push({
                    id: leaveId,
                    ...leave,
                    reqType: 'leave',          // L70: Discriminator
                    uid,
                    employeeName: rawUsers[uid]?.name || 'Unknown',  // L72: Lookup name from users
                    isPending
                })
            })
        })
        
        // L78-80: Merge and sort by timestamp (most recent first)
        const merged = [...attItems, ...leaveItems].sort((a, b) => {
            return (b.timestamp || b.appliedAt || 0) - (a.timestamp || a.appliedAt || 0)
        })
        
        setApprovals(merged)  // L82: Update state triggers re-render
        setLoading(false)     // L83: Hide loading spinner
    }
    
    // L86-87: Register listeners with snapshot handlers
    const unsubUsers = onValue(usersRef, snap => { rawUsers = snap.val() || {}; updateData() })
    const unsubLeaves = onValue(leavesRef, snap => { rawLeaves = snap.val() || {}; updateData() })
    
    return () => { unsubUsers(); unsubLeaves() }  // L89: Cleanup on unmount
}, [])  // L90: Empty deps = register once
```

**State Transitions**:
```
Initial:    loading=true, approvals=[]
Data Load:  loading=false, approvals=[{reqType: 'attendance', ...}, {reqType: 'leave', ...}]
Real-time:  New approval added → updateData() called → approvals updated → UI re-renders
```

**🔴 Failure Path**: If Firebase listener disconnects, last cached data remains displayed with stale state

#### Approval Action Handler

**Lines 92-147: Unified Action Handler**

```javascript
const handleAction = async (item, status, reason = '') => {
    setProcessingId(item.id)  // L93: Disable specific request card
    
    try {
        if (item.reqType === 'leave') {
            // L97-104: Leave approval (calls different API)
            if (status === 'approved') {
                await ApiService.post('/api/leave/approve', {
                    leaveId: item.id,
                    employeeId: item.uid,
                    mdId: currentUser.uid,
                    mdName: userProfile?.email || 'MD'
                })
            } else {
                // L113-122: Direct Firebase update for rejection
                const leaveRef = ref(database, `leaves/${item.uid}/${item.id}`)
                await update(leaveRef, {
                    status: status,
                    actionData: {
                        by: currentUser.uid,
                        name: userProfile?.email || 'MD',
                        at: new Date().toISOString(),
                        reason: reason || ''
                    }
                })
            }
        } else {
            // L125-134: Attendance approval/rejection
            await ApiService.post('/api/attendance/status', {
                employeeUid: item.employeeUid,
                date: item.date,
                status: status,              // L128: "approved" or "rejected"
                reason: reason || null,
                actionData: {
                    name: userProfile?.email || 'MD'
                }
            })
        }
        
        // L137: ⚠️ CRITICAL - Frontend does NOT update local state
        // Relies on real-time listener to reflect backend change
        setToast({ type: 'success', message: `Request ${status} successfully` })
    } catch (error) {
        console.error("Error updating status:", error)
        setToast({ type: 'error', message: "Failed to update status" })
    } finally {
        setProcessingId(null)  // L143: Re-enable buttons
        setRejectModal({ isOpen: false, item: null, reason: '' })  // L144: Close modals
        setApproveModal({ isOpen: false, item: null })
    }
}
```

💡 **Design Decision**: Leave approval requires backend API (for atomic balance deduction), but leave rejection uses direct Firebase write. Asymmetry exists because rejection doesn't modify balance.

**⚠️ Inconsistency**: Attendance uses backend API for both approve/reject (consistent), but leave mixes API + direct writes.

### Backend: `backend/src/controllers/attendanceController.js`

#### Status Update Handler

**Lines 174-280: Update Attendance Status**

```javascript
exports.updateStatus = async (req, res) => {
    const { employeeUid, date, status, reason, actionData } = req.body  // L175: Destructure
    
    // L177-179: Validation
    if (!employeeUid || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' })
    }
    
    try {
        const attendanceRef = db.ref(`employees/${employeeUid}/attendance/${date}`)  // L184
        
        // L186-214: Status resolution and CO earning logic
        let finalStatus = status
        let balanceUpdateMsg = null
        
        if (status === 'approved') {
            finalStatus = 'Present'  // L191: Map action to state
            
            // L194-195: Check if date is Sunday or holiday
            const isHoliday = isNationalHoliday(date)
            const isSun = isSunday(date)
            
            if (isHoliday || isSun) {
                // L198-213: Grant Compensatory Off (atomic transaction)
                const balanceRef = db.ref(`employees/${employeeUid}/leaveBalance/co`)
                
                // L210: ⚠️ CRITICAL - Firebase transaction for atomicity
                await balanceRef.transaction((current) => (current || 0) + 1)
                
                balanceUpdateMsg = `Earned 1 CO for working on ${isHoliday ? 'Holiday' : 'Sunday'}`
                console.log(`[Attendance] ${balanceUpdateMsg} - ${employeeUid}`)
            }
        }
```

**💡 Transaction Explanation**:
```javascript
transaction((current) => {
    // Firebase guarantees:
    // 1. Reads current value
    // 2. Executes callback with current value
    // 3. Writes returned value ONLY if current hasn't changed
    // 4. If changed, retries with new current value
    // 5. If callback returns undefined, aborts transaction
    
    return (current || 0) + 1  // Increment or initialize to 1
})
```

**Race Condition Scenario**:
```
Time    MD1 Thread                  MD2 Thread                  Database
----    ----------                  ----------                  --------
T0                                                              co: 0
T1      Read co=0                   
T2                                  Read co=0
T3      Compute co=1                
T4                                  Compute co=1
T5      Write co=1 (success)
T6                                  Write co=1 (ABORTED!)       co: 1
T7                                  Retry: Read co=1
T8                                  Compute co=2
T9                                  Write co=2 (success)        co: 2
```

💡 **Result**: Both approvals honored, final balance = 2 (correct). Without transaction, final balance would be 1 (lost update).

```javascript
        // L217-232: Prepare update object
        const updates = {
            status: finalStatus,                                      // L218: "Present" or "rejected"
            actionTimestamp: Date.now(),                              // L219: When MD acted
            approvedAt: status === 'approved' ? new Date().toISOString() : null,
            rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
            handledBy: actionData?.name || 'MD',                       // L222: MD email for audit
            mdReason: reason || balanceUpdateMsg || null,              // L223: Rejection reason or CO message
            employeeNotified: false                                    // L224: Reset flag (will be set after notification)
        }
        
        if (status === 'approved') {
            updates.isCorrection = false  // L229: Clear correction flag if present
        }
        
        await attendanceRef.update(updates)  // L232: Atomic write at path level
        console.log(`[Attendance] Status updated to ${finalStatus} for ${employeeUid}`)
```

**Database Write**: `/employees/{employeeUid}/attendance/{date}`

**Side Effects**:
- 1 database write (attendance record)
- 0-1 database writes (CO balance if applicable)
- Console log

```javascript
        // L236-242: Audit log
        await db.ref('audit').push({
            actor: actionData?.name || 'MD',
            action: status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
            target: { employeeId: employeeUid, date: date },
            details: { newStatus: status, reason },
            timestamp: Date.now()
        })
```

**Audit Log Path**: `/audit/{pushId}` (auto-generated ID)

**⚠️ Non-Transactional**: Audit log write is separate from attendance update. If audit write fails, attendance still approved but no audit trail.

```javascript
        // L245-272: Employee notification
        const tokenSnap = await db.ref(`fcm_tokens/${employeeUid}`).once('value')
        const tokenData = tokenSnap.val()
        
        const empTokens = []
        if (tokenData && tokenData.token && tokenData.permission === 'granted') {
            empTokens.push(tokenData.token)
        }
        
        if (empTokens.length > 0) {
            const isApproved = status === 'approved'
            const title = isApproved ? 'Attendance Approved' : 'Attendance Rejected'
            const body = isApproved
                ? 'Your attendance for today has been approved.'
                : `Your attendance was rejected. Reason: ${reason || 'Contact MD'}`
            
            await sendMulticast(
                empTokens,
                { title, body },
                {
                    action: 'VIEW_STATUS',
                    attendanceId: date
                }
            )
            
            await attendanceRef.update({ employeeNotified: true })  // L271: Mark as notified
        }
        
        res.json({ success: true, message: `Status updated to ${status}` })  // L274
```

**🔴 Failure Paths**:
- **CO transaction fails**: Attendance approved but CO not granted (partial success)
- **Audit log fails**: Approval succeeds but no audit trail
- **FCM notification fails**: Approval succeeds but employee not notified, `employeeNotified` remains false

---

## 8. Notification System

### Token Registration: `src/services/fcm.js`

**Purpose**: FCM token lifecycle management (request permission, register, foreground handling)

#### Permission Request Flow

**Lines 16-67: Request Notification Permission**

```javascript
export const requestNotificationPermission = async (uid) => {
    try {
        // L19-21: Check browser support
        if (!('serviceWorker' in navigator)) {
            console.warn('[FCM] This browser does not support service workers')
            return  // L21: Silent failure (no error thrown)
        }
        
        if (!('Notification' in window)) {
            console.warn('[FCM] This browser does not support notifications')
            return
        }
```

💡 **Graceful Degradation**: Missing service worker support doesn't break app—just disables background notifications.

```javascript
        // L28: Request permission (triggers browser prompt)
        const permission = await Notification.requestPermission()
        console.log('[FCM] Permission result:', permission)
        
        if (permission === 'granted') {
            // L32-37: Wait for service worker activation
            const registration = await navigator.serviceWorker.ready
            console.log('[FCM] Service Worker is ready')
            
            // L39-42: Get token with VAPID key
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,                              // L40: Public key from Firebase Console
                serviceWorkerRegistration: registration           // L41: ⚠️ CRITICAL - Must pass SW registration
            })
            
            console.log('[FCM] Token obtained:', token)
```

**⚠️ Common Error**: Forgetting `serviceWorkerRegistration` parameter → token request fails with cryptic error "Missing or invalid service worker registration"

```javascript
            // L46-52: Send to backend
            await ApiService.post('/api/fcm/register', {
                uid,
                token,
                platform: 'web',
                permission: 'granted',
                timestamp: new Date().toISOString()
            })
            
            console.log('[FCM] Token registered with backend')
            return token  // L55
        } else if (permission === 'denied') {
            console.warn('[FCM] Notification permission denied')
            // L59: Send denial status to backend (for stats tracking)
            await ApiService.post('/api/fcm/register', {
                uid,
                permission: 'denied',
                timestamp: new Date().toISOString()
            })
        }
    } catch (error) {
        console.error('[FCM] Permission/Token Error:', error)
        // L67: Silent failure (notification optional, not critical)
    }
}
```

**State Transitions**:
```
Initial:       No token registered
Permission:    Browser prompt → User clicks "Allow"
Token Gen:     FCM SDK generates unique token (60-day expiry)
Backend Reg:   Token stored in /fcm_tokens/{uid}
Result:        Push notifications enabled
```

**🔴 Failure Paths**:
- **Permission denied**: Status recorded, no token generated
- **Service worker not ready**: `navigator.serviceWorker.ready` times out (rare)
- **VAPID key mismatch**: Token generation fails silently

#### Foreground Message Handler

**Lines 73-103: On Message Listener**

```javascript
export const setupForegroundNotifications = () => {
    if (!messaging) return  // L74: Guard if FCM not initialized
    
    // L76: Register foreground message handler
    onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground Message Received:', payload)
        
        // L79-80: Extract data payload
        const { type, route, date } = payload.data || {}
        
        // L82-84: Dispatch custom event for debugging/monitoring
        const event = new CustomEvent('FCM_MESSAGE_RECEIVED', {
            detail: payload
        })
        window.dispatchEvent(event)
        
        // L87-88: Extract notification content (fallback to default)
        const title = payload.notification?.title || "Attendance Reminder"
        const body = payload.notification?.body || "Mark your attendance for today"
        
        // L91-95: Create browser notification manually
        const notif = new Notification(title, {
            body: body,
            icon: '/pwa-192x192.png',
            data: payload.data  // L94: Pass data for click handler
        })
        
        // L97-100: Click handler
        notif.onclick = function() {
            notif.close()
            window.location.href = '/dashboard'  // L99: Navigate to dashboard
        }
    })
}
```

💡 **Why Manual Notification**: FCM's automatic notification rendering only works when app is backgrounded. For foreground (app visible), must manually create `Notification` object.

**Foreground Flow**:
```
1. MD approves attendance
2. Backend sends FCM message with data payload
3. FCM routes to active browser tab
4. onMessage handler fires
5. JavaScript creates Notification object
6. Browser displays notification (even though app is visible)
7. User clicks → navigates to /dashboard
```

### Service Worker: `src/sw.js`

**Purpose**: Background script for PWA caching and FCM message handling when app closed

#### Firebase Initialization in Service Worker

**Lines 18-41: Firebase Setup**

```javascript
// L21-22: Import Firebase SDKs (compat version for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// L25-35: Firebase config (injected at build time)
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__",                   // L28: Replaced by build script
    authDomain: "__FIREBASE_AUTH_DOMAIN__",
    databaseURL: "__FIREBASE_DATABASE_URL__",
    projectId: "__FIREBASE_PROJECT_ID__",
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__"
}
```

💡 **Build-Time Injection**: Placeholder values replaced by `scripts/generate-sw-config.cjs` during Vite build. Keeps credentials out of source control.

```javascript
// L38-41: Initialize Firebase in SW context
try {
    firebase.initializeApp(firebaseConfig)           // L39: Must be synchronous
    const messaging = firebase.messaging()
    console.log('[ATLAS SW] Firebase Messaging initialized')
```

**⚠️ Critical**: Service worker runs in separate thread from main app. Must initialize Firebase independently—cannot share instance with main thread.

#### Background Message Handler

**Lines 45-71: On Background Message**

```javascript
    // L45: Official FCM background message handler
    messaging.onBackgroundMessage((payload) => {
        console.log('[ATLAS SW] Background message received:', payload)
        
        // L49: Extract data (backend sends data-only payload)
        const { type, route, date } = payload.data || {}
        
        // L52-67: Construct notification with hardcoded content
        const notificationTitle = "Attendance Reminder"  // L52: ⚠️ Hardcoded (ignores backend title)
        const notificationOptions = {
            body: "Mark your attendance for today",     // L54: ⚠️ Hardcoded (ignores backend body)
            icon: '/pwa-192x192.png',                    // L55: App icon
            badge: '/pwa-192x192.png',                   // L56: Small icon for Android notification shade
            tag: 'attendance-reminder',                  // L57: Prevents duplicate notifications
            requireInteraction: true,                    // L58: Notification persists until clicked
            vibrate: [200, 100, 200],                    // L59: Vibration pattern (200ms on, 100ms off, 200ms on)
            data: {
                type,
                route,
                date,
                url: '/',
                action: route                             // L65: Used by click handler
            }
        }
        
        // L70: Show notification (async operation)
        return self.registration.showNotification(notificationTitle, notificationOptions)
    })
```

💡 **Design Decision**: Backend sends data-only payload (no `notification` field). Service worker controls final notification appearance. This allows:
- Frontend to customize notification without backend deployment
- A/B testing notification content via SW updates
- Consistent notification styling across all message types

**⚠️ Limitation**: All notifications show same title/body regardless of context (attendance vs leave, approval vs rejection).

**Improved Implementation**:
```javascript
// HYPOTHETICAL (better approach):
const { type, route, employeeName } = payload.data || {}

let title, body
if (type === 'REVIEW_ATTENDANCE') {
    title = 'New Attendance Request'
    body = `${employeeName} has marked attendance`
} else if (type === 'ATTENDANCE_APPROVED') {
    title = 'Attendance Approved'
    body = 'Your attendance has been approved'
}

const notificationOptions = {
    body: body,
    data: payload.data
}
```

#### Notification Click Handler

**Lines 80-104: Click Event Listener**

```javascript
self.addEventListener('notificationclick', (event) => {
    console.log('[ATLAS SW] Notification clicked:', event.notification.data)
    
    event.notification.close()  // L83: Dismiss notification
    
    // L86-87: Determine target URL from action
    const action = event.notification.data?.action
    let targetUrl = '/'
    
    if (action === 'MARK_ATTENDANCE') {
        targetUrl = '/dashboard'
    }
    
    // L93-104: Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })  // L94: Find all app windows
            .then((clientList) => {
                // L96-100: Check if app already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus()  // L99: Focus existing window
                        return client.navigate(targetUrl)  // Navigate to target
                    }
                }
                // L103: No existing window → open new one
                return clients.openWindow(targetUrl)
            })
    )
})
```

**User Experience Flow**:
```
1. App closed/backgrounded
2. MD approves attendance
3. FCM delivers message to device
4. Service worker displays notification
5. User clicks notification
   a. If app already open in background → focuses window, navigates to /dashboard
   b. If app closed → opens new window at /dashboard
6. Notification dismissed
```

💡 **UX Optimization**: Prevents opening duplicate tabs when app already running.

### Backend: `backend/src/controllers/notificationController.js`

#### Token Registration Handler

**Lines 10-83: Register Token**

```javascript
const registerToken = async (req, res) => {
    try {
        const { uid, token, platform, permission } = req.body  // L12
        
        // L14-16: Validation
        if (!uid || !permission) {
            return res.status(400).json({ error: 'Missing required fields' })
        }
        
        // L44-51: Handle denial status
        if (permission === 'denied') {
            // L47-49: Remove token if exists (user revoked permission)
            if (token) {
                await db.ref(`deviceTokens/${token}`).remove()
            }
            return res.json({ success: true, message: 'Token removed (Permission Denied)' })
        }
        
        // L53-55: Token required for granted permission
        if (!token) {
            return res.status(400).json({ error: 'Token is required for granted permission' })
        }
```

**Permission States**:
- **"granted"**: User allowed notifications → Register token
- **"denied"**: User blocked notifications → Remove token (if exists)
- **"default"**: User dismissed prompt → No action (frontend will retry)

```javascript
        // L58-66: Prepare token data
        const tokenData = {
            uid: uid,
            email: req.body.email || 'unknown',              // L60: Frontend should send email
            platform: platform || 'web',
            notificationsEnabled: true,
            userAgent: req.headers['user-agent'] || 'unknown',  // L63: Track device type
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()               // L65: Updated on each registration
        }
        
        // L69-74: Fetch email from profile if not provided
        if (tokenData.email === 'unknown') {
            const userSnap = await db.ref(`employees/${uid}/profile`).once('value')
            if (userSnap.exists()) {
                tokenData.email = userSnap.val().email || 'unknown'
            }
        }
        
        await db.ref(`deviceTokens/${token}`).set(tokenData)  // L76: Overwrite if exists
        
        res.json({ success: true, message: 'Token registered' })
    } catch (error) {
        console.error('Register Token Error:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}
```

**Database Path**: `/deviceTokens/{token}` (keyed by token, not UID)

💡 **Why Key by Token**: Enables efficient lookup when pruning invalid tokens. If keyed by UID, would need to query all tokens to find invalid ones.

**⚠️ Missing**: Token expiry tracking. FCM tokens expire after ~60 days of inactivity. Should track `lastUsed` timestamp and prune tokens older than 60 days.

---

## 9. Leave Management

### Backend: `backend/src/controllers/leaveController.js`

#### Apply Leave Handler

**Lines 46-146: Leave Application**

```javascript
const applyLeave = async (req, res) => {
    try {
        const { employeeId, employeeName, type, from, to, reason } = req.body  // L48
        
        const TodayIST = getTodayDateIST()  // L50: Helper function for IST timezone
        
        // L53-66: Date validation
        const dFrom = new Date(from)
        const dToday = new Date(TodayIST)
        dFrom.setHours(0, 0, 0, 0)  // L55: Normalize to midnight for comparison
        dToday.setHours(0, 0, 0, 0)
        
        if (dFrom < dToday) return res.status(400).json({ error: 'Cannot apply for past dates' })  // L58
        if (to < from) return res.status(400).json({ error: 'End date must be after start date' })
        
        const totalDays = getLeaveDaysCount(from, to)  // L61: Helper counts business days
        if (totalDays > 30) return res.status(400).json({ error: 'Leave duration cannot exceed 30 days' })
        
        // L64-66: Advance limit (cannot apply more than 30 days in future)
        const maxDate = new Date(TodayIST)
        maxDate.setDate(maxDate.getDate() + 30)
        if (new Date(to) > maxDate) return res.status(400).json({ error: 'Cannot apply more than 30 days in advance' })
```

💡 **Business Rules**: 
- Max 30 consecutive days per request
- Max 30 days advance booking
- No retroactive leave application

```javascript
        // L69-85: Balance check
        const daysCount = getLeaveDaysCount(from, to)
        const balSnap = await db.ref(`employees/${employeeId}/leaveBalance`).once('value')
        const balance = balSnap.val() || { pl: 17, co: 0 }  // L73: Default balance
        
        if (type === 'PL') {
            if (balance.pl < daysCount) {
                return res.status(400).json({
                    error: `Insufficient PL Balance. Available: ${balance.pl}, Required: ${daysCount}`
                })
            }
        } else if (type === 'CO') {
            if (balance.co < daysCount) {
                return res.status(400).json({
                    error: `Insufficient Comp Off Balance. Available: ${balance.co}, Required: ${daysCount}`
                })
            }
        } else if (type === 'National Holiday') {
            return res.status(400).json({ error: 'Cannot apply for National Holiday manually.' })
        }
```

**⚠️ Race Condition**: Balance check is separate from deduction. If employee applies two overlapping leaves simultaneously:
```
Time    Request A                   Request B                   Balance
----    ---------                   ---------                   -------
T0                                                              pl: 5
T1      Check: 5 >= 3 ✓             
T2                                  Check: 5 >= 3 ✓
T3      Write leave A               
T4                                  Write leave B
T5      Both approved, balance check passed but...
```

**Solution**: Balance deduction happens at approval time with transaction (see approval handler).

```javascript
        // L87-94: Overlap check
        const conflict = await checkLeaveOverlap(employeeId, from, to)  // L88: Helper function
        if (conflict) {
            if (conflict.status === 'approved') {
                return res.status(409).json({
                    error: 'Request Failed: You already have an approved leave for these dates.'
                })
            }
            return res.status(409).json({
                error: 'Request Failed: You already have a pending request for these dates.'
            })
        }
```

**checkLeaveOverlap Helper** (Lines 13-44):
```javascript
const checkLeaveOverlap = async (employeeId, from, to) => {
    const leavesSnap = await db.ref(`leaves/${employeeId}`).once('value')  // L14
    const leaves = leavesSnap.val() || {}
    
    const newStart = new Date(from)  // L17
    const newEnd = new Date(to)
    newStart.setHours(0, 0, 0, 0)
    newEnd.setHours(0, 0, 0, 0)
    
    // L22-38: Check each existing leave for overlap
    for (const leaveId in leaves) {
        const leave = leaves[leaveId]
        if (leave.status === 'rejected') continue  // L25: Skip rejected leaves
        
        const existingStart = new Date(leave.from)  // L27
        const existingEnd = new Date(leave.to)
        existingStart.setHours(0, 0, 0, 0)
        existingEnd.setHours(0, 0, 0, 0)
        
        // L33-36: Overlap detection (any intersection)
        if (
            (newStart >= existingStart && newStart <= existingEnd) ||  // New start falls within existing
            (newEnd >= existingStart && newEnd <= existingEnd) ||      // New end falls within existing
            (newStart <= existingStart && newEnd >= existingEnd)       // New completely contains existing
        ) {
            return leave  // L37: Return conflicting leave
        }
    }
    
    return null  // L41: No conflict
}
```

💡 **Overlap Logic**: Three conditions cover all overlap scenarios:
```
Scenario 1: New starts during existing
    Existing: [-----]
    New:          [-----]

Scenario 2: New ends during existing
    Existing:     [-----]
    New:      [-----]

Scenario 3: New contains existing
    Existing:   [---]
    New:      [---------]
```

```javascript
        // L96-140: Attendance conflict check and leave creation
        const isAttendanceOverlap = await checkAttendanceOverlap(employeeId, from, to)
        if (isAttendanceOverlap) {
            // L98-117: Auto-block leave (marked attendance for dates)
            const leaveRef = db.ref(`leaves/${employeeId}`).push()
            const leaveId = leaveRef.key
            
            await leaveRef.set({
                employeeId,
                employeeName,
                employeeEmail: req.body.employeeEmail || '',
                type,
                from,
                to,
                totalDays: daysCount,
                reason,
                status: 'auto-blocked',  // L111: Special status for attendance conflict
                appliedAt: new Date().toISOString(),
                actionData: null
            })
            
            return res.status(409).json({
                error: 'Leave Request Auto-Blocked: You have already marked attendance for one or more days in this range.'
            })
        } else {
            // L118-140: Create leave request normally
            const leaveRef = db.ref(`leaves/${employeeId}`).push()
            const leaveId = leaveRef.key
            
            await leaveRef.set({
                employeeId,
                employeeName,
                employeeEmail: req.body.employeeEmail || '',
                type,
                from,
                to,
                totalDays: daysCount,
                reason,
                status: 'pending',                               // L131: Awaiting MD approval
                appliedAt: new Date().toISOString(),
                actionData: null
            })
            
            // L137-140: Notify MDs (implementation omitted here)
            
            res.json({ success: true, leaveId })
        }
```

**Database Path**: `/leaves/{employeeId}/{leaveId}`

#### Approve Leave Handler

**Lines 179-258: Leave Approval with Balance Deduction**

```javascript
const approveLeave = async (req, res) => {
    try {
        const { leaveId, employeeId, mdId, mdName } = req.body  // L181
        
        // L183-189: Fetch leave request
        const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`)
        const leaveSnap = await leaveRef.once('value')
        
        if (!leaveSnap.exists()) {
            return res.status(404).json({ error: 'Leave request not found' })
        }
        
        const leave = leaveSnap.val()  // L191
        const { type, totalDays } = leave
```

**Lines 193-215: Atomic Balance Deduction**

```javascript
        // L193-215: ⚠️ CRITICAL - Transaction for atomic balance deduction
        const balanceRef = db.ref(`employees/${employeeId}/leaveBalance/${type.toLowerCase()}`)
        
        const txnResult = await balanceRef.transaction((current) => {
            if (current == null) {
                // L197-198: Initialize balance if missing
                current = type === 'PL' ? 17 : 0
            }
            
            if (current < totalDays) {
                return  // L202: Abort transaction (undefined return)
            }
            
            return current - totalDays  // L205: Deduct days
        })
        
        if (!txnResult.committed) {
            // L210-214: Transaction aborted (insufficient balance)
            return res.status(400).json({
                error: `Insufficient ${type} balance. Required: ${totalDays}, Available: ${txnResult.snapshot.val() || 0}`
            })
        }
```

**Transaction Flow**:
```
1. Read current balance
2. Check if sufficient (current >= totalDays)
3. If yes: Write (current - totalDays)
4. If no: Return undefined → transaction aborts
5. Firebase retries if balance changed during transaction
```

**Concurrent Approval Scenario**:
```
Time    MD1 Approves Leave A        MD2 Approves Leave B        Balance
----    --------------------        --------------------        -------
        (3 days)                    (4 days)
T0                                                              pl: 5
T1      Transaction start: read pl=5
T2                                  Transaction start: read pl=5
T3      Check: 5 >= 3 ✓             
T4      Compute: 5-3=2              
T5      Write pl=2 (success)                                    pl: 2
T6                                  Check: 5 >= 4 ✓
T7                                  Compute: 5-4=1
T8                                  Write pl=1 (CONFLICT!)
T9                                  Retry: read pl=2
T10                                 Check: 2 >= 4 ✗
T11                                 Return undefined (abort)
T12                                 respond 400 "Insufficient balance"
```

💡 **Result**: Leave A approved (balance=2), Leave B rejected (insufficient balance). Without transaction, both would approve and balance would be -2 (data corruption).

```javascript
        // L217-230: Update leave status
        await leaveRef.update({
            status: 'approved',
            actionData: {
                by: mdId,
                name: mdName,
                at: new Date().toISOString()
            }
        })
        
        // L232-246: Send notification to employee
        await sendPushNotification(
            employeeId,
            {
                title: 'Leave Approved',
                body: `Your ${type} leave request for ${totalDays} day(s) has been approved.`
            },
            {
                action: 'VIEW_LEAVE_STATUS',
                leaveId: leaveId
            }
        )
        
        res.json({ success: true, message: 'Leave approved and balance updated' })
```

---

## 10. Excel Export System

### Backend: `backend/src/controllers/exportController.js`

**Purpose**: Generate monthly attendance matrix as Excel file (date×employee grid)

#### Data Aggregation

**Lines 4-77: Fetch and Sort Data**

```javascript
const exportAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query  // L6: e.g., ?month=1&year=2025
        
        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' })
        }
        
        const monthNum = parseInt(month)   // L12
        const yearNum = parseInt(year)
        
        // L16-22: Fetch all users (⚠️ loads entire tree)
        const usersSnapshot = await db.ref('users').once('value')
        const usersData = usersSnapshot.val() || {}
        
        const employees = Object.entries(usersData)
            .map(([uid, user]) => ({ uid, ...user }))  // L20: Add UID to user object
```

**Lines 23-56: Custom Employee Sorting**

```javascript
            .sort((a, b) => {
                const emailA = (a.email || '').toLowerCase()
                const emailB = (b.email || '').toLowerCase()
                const nameA = (a.name || a.email || '').toUpperCase()
                const nameB = (b.name || b.email || '').toUpperCase()
                
                // L29-35: 1. RVS first (auto-marked employee)
                const isRvsA = nameA.includes('RVS')
                const isRvsB = nameB.includes('RVS')
                
                if (isRvsA && !isRvsB) return -1  // RVS before others
                if (!isRvsA && isRvsB) return 1
                if (isRvsA && isRvsB) return 0    // Both RVS, maintain order
                
                // L38-52: 2. Active MDs second
                const isSantyA = emailA === 'santy9shinde@gmail.com'  // L38: HR email
                const isSantyB = emailB === 'santy9shinde@gmail.com'
                
                const isRealMDA = a.role === 'md' && !isSantyA && !isRvsA  // L42: Active MD (not HR, not RVS)
                const isRealMDB = b.role === 'md' && !isSantyB && !isRvsB
                
                if (isRealMDA && !isRealMDB) return -1
                if (!isRealMDA && isRealMDB) return 1
                
                // L50-52: 3. HR (Santy) third
                if (isSantyA && !isSantyB) return -1
                if (!isSantyA && isSantyB) return 1
                
                // L55: 4. Other employees alphabetically
                return nameA.localeCompare(nameB)
            })
```

💡 **Sort Order**: Custom business logic prioritizes specific employees:
```
1. RVS (auto-marked, special employee)
2. Active managing directors
3. HR (Santy)
4. Regular employees (alphabetical)
```

```javascript
        // L59-70: Fetch all data
        const attendanceSnapshot = await db.ref('attendance').once('value')
        const attendanceData = attendanceSnapshot.val() || {}
        const attendanceRecords = Object.values(attendanceData)  // L61: Flatten to array
        
        const leavesSnapshot = await db.ref('leaves').once('value')
        const leavesData = leavesSnapshot.val() || {}
        const allLeaves = []
        Object.values(leavesData).forEach(userLeaves => {
            Object.values(userLeaves).forEach(leave => allLeaves.push(leave))  // L69: Flatten nested structure
        })
```

**Memory Usage**:
- ~25 employees × 30 days = 750 attendance records
- ~25 employees × 2 leaves/month = 50 leave records
- Total: ~800 objects loaded into memory
- At 1KB/object: ~800KB memory (acceptable)
- At 1000 employees: ~80MB (would cause issues on free tier)

#### Excel Generation

**Lines 79-245: Matrix Construction**

```javascript
        // L73-77: Generate date array
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate()  // L73: 0th day of next month = last day of current
        const dates = []
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(yearNum, monthNum - 1, day))  // L76: monthNum-1 because Date() is 0-indexed
        }
        
        // L80-81: Create workbook
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Attendance')
        
        // L84-99: Title rows
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthName = monthNames[monthNum - 1]
        
        // L88-92: Row 1 - Company name
        worksheet.mergeCells(1, 1, 1, employees.length + 1)  // L88: Merge across all columns
        const titleCell = worksheet.getCell(1, 1)
        titleCell.value = 'Autoteknic'
        titleCell.font = { size: 16, bold: true }
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        
        // L95-99: Row 2 - Month/Year
        worksheet.mergeCells(2, 1, 2, employees.length + 1)
        const subtitleCell = worksheet.getCell(2, 1)
        subtitleCell.value = `Attendance ${monthName} ${yearNum}`  // L97: e.g., "Attendance Jan 2025"
```

**Lines 102-121: Header Row**

```javascript
        // L102-121: Row 3 - Headers (DATE + Employee names)
        const headerRow = worksheet.getRow(3)
        headerRow.getCell(1).value = 'DATE'
        headerRow.getCell(1).font = { bold: true }
        headerRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }  // L108: Gray background
        }
        
        employees.forEach((emp, index) => {
            const cell = headerRow.getCell(index + 2)  // L112: index+2 because column 1 is DATE
            cell.value = (emp.name || emp.email).toUpperCase()
            cell.font = { bold: true }
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            }
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
```

**Lines 124-212: Data Rows (Core Logic)**

```javascript
        dates.forEach((date, dateIndex) => {
            const row = worksheet.getRow(dateIndex + 4)  // L125: Data starts row 4
            const dateStr = date.toISOString().split('T')[0]  // L126: "2025-01-15"
            const dayOfWeek = date.getDay()
            const isSunday = dayOfWeek === 0  // L128
            
            // L131-143: Date column
            const dateCell = row.getCell(1)
            dateCell.value = `${date.getDate()}-${monthName}-${yearNum.toString().slice(-2)}`  // L132: "15-Jan-25"
            dateCell.font = { bold: true, size: 11 }
            dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
            
            if (isSunday) {
                dateCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF00' }  // L141: Yellow for Sunday
                }
            }
            
            // L145-212: Fill each employee column
            employees.forEach((emp, empIndex) => {
                const cell = row.getCell(empIndex + 2)
                const empName = (emp.name || '').toUpperCase()
                const isRVS = empName.includes('RVS')
                
                cell.font = { bold: true, size: 10 }  // L151: All cells bold
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                
                // L154-167: RVS auto-marking logic
                if (isRVS) {
                    if (isSunday) {
                        cell.value = 'H'  // L157: Holiday
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' }  // Yellow
                        }
                    } else {
                        cell.value = 'OFFICE'  // L164: Auto-marked as present
                    }
                    return  // L166: Skip leave/attendance check for RVS
                }
```

💡 **Special Logic**: RVS (specific employee) auto-marked present for all weekdays, holiday for Sundays. Hardcoded business rule for owner/MD who doesn't manually mark.

```javascript
                // L170-179: Check for approved leave
                const leave = allLeaves.find(l => {
                    if (l.employeeEmail !== emp.email || l.status !== 'approved') return false
                    const leaveStart = new Date(l.from)
                    const leaveEnd = new Date(l.to)
                    leaveStart.setHours(0, 0, 0, 0)
                    leaveEnd.setHours(0, 0, 0, 0)
                    const checkDate = new Date(date)
                    checkDate.setHours(0, 0, 0, 0)
                    return checkDate >= leaveStart && checkDate <= leaveEnd  // L178: Date in leave range
                })
                
                // L181-194: Cell value logic
                if (isSunday) {
                    cell.value = 'H'
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }  // Yellow
                } else if (leave) {
                    cell.value = 'L'  // L189: Leave
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF90EE90' }  // L193: Light green
                    }
                } else {
                    // L196-211: Check attendance record
                    const record = attendanceRecords.find(r =>
                        r.date === dateStr &&
                        (r.employeeEmail === emp.email || r.employeeId === emp.uid)  // L199: Match by email OR uid
                    )
                    
                    if (record && record.status === 'approved') {
                        if (record.location === 'office') {
                            cell.value = 'OFFICE'  // L204
                        } else if (record.location === 'site') {
                            cell.value = record.siteName ? record.siteName.toUpperCase() : 'SITE'  // L206
                        }
                    } else {
                        cell.value = ''  // L209: Blank = no record
                    }
                }
            })
        })
```

**Cell Values**:
- **"H"**: Holiday (Sunday or national holiday)
- **"L"**: On leave (approved leave)
- **"OFFICE"**: Present at office
- **Site name**: Present at specific site (e.g., "MUMBAI CONSTRUCTION")
- **Blank**: No attendance record

**Color Coding**:
- Yellow: Sundays/holidays
- Light green: Approved leaves
- White (default): Regular attendance

**Lines 247-253: File Download**

```javascript
        // L247-248: Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer()
        
        // L250-252: Send as download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${monthName}_${yearNum}.xlsx`)
        res.send(buffer)
```

**HTTP Response**:
- Content-Type triggers download (not inline display)
- Content-Disposition sets filename
- Binary buffer sent directly

**🔴 Failure Paths**:
- **Large dataset**: ExcelJS buffer generation times out (>30s) on free tier
- **Memory limit**: Render free tier has 512MB limit; large exports may exceed
- **Invalid date range**: Returns malformed Excel file (empty grid)

---

## Summary: Complete System Flow

### End-to-End: Attendance Mark to Approval

**Timeline**: ~1-5 minutes total

```
T+0s    Employee opens app
T+1s    Taps "Mark Attendance"
T+2s    Selects "Office", taps "Send for Approval"
T+2s    Frontend POST /api/attendance/mark
T+3s    Backend validates, writes to /employees/{uid}/attendance/{date}
T+3s    Backend queries MD tokens, sends FCM multicast
T+4s    FCM delivers to MD devices
T+5s    MD phone vibrates, notification shows
T+30s   MD taps notification, opens Approvals page
T+32s   MD sees new request (real-time listener)
T+35s   MD taps "Approve Request"
T+36s   Frontend POST /api/attendance/status
T+37s   Backend updates status to "Present", grants CO if applicable
T+37s   Backend sends FCM to employee
T+38s   Employee receives "Attendance Approved" notification
T+38s   Employee dashboard updates to "You're Checked In!"
```

**Database Writes**: 5 total (1 mark + 1 mdNotified + 1 approve + 1 audit + 1 employeeNotified)

**FCM Messages**: 2 total (1 to MDs + 1 to employee)

**Real-time Propagation**: 2 UI updates (employee dashboard + MD approval queue)

---

**End of Part 2**  
**Completion**: 10/10 sections documented  
**Total Pages**: ~40 (combined Part 1 + Part 2)  
**Code Lines Explained**: 1000+ with rationale  
**Ready for**: Deep technical interviews, onboarding, system maintenance
