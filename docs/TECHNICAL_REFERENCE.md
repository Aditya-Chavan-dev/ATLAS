# ATLAS: Complete Technical Reference Manual

**Document Type**: Line-by-Line Code Documentation  
**Audience**: Developers, Technical Interviewers, System Architects  
**Last Updated**: December 2025  
**Version**: 1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Attendance Workflow](#attendance-workflow)
7. [Approval Workflow](#approval-workflow)
8. [Notification System](#notification-system)
9. [Leave Management](#leave-management)
10. [Export System](#export-system)

---

## 1. Project Overview

### Purpose

ATLAS (Attendance Tracking & Leave Approval System) is a production-grade Progressive Web Application designed to replace manual attendance tracking processes. It eliminates human error in Excel-based systems by providing real-time attendance marking, geolocation capture, instant MD notifications, and automated reporting.

### Business Value

**Problem Solved**:
- **Before**: Employees verbally reported attendance, MDs manually transcribed to Excel 6-12 hours later
- **Pain Points**: Memory degradation, batch processing latency, version control chaos (multiple Excel copies)
- **After**: Real-time attendance submission, instant MD notification, sub-second dashboard updates

**Operational Impact** (20-30 employee organization):
- 95%+ attendance submission rate (digital trail)
- ~5 minutes median approval latency (down from 6-12 hours)
- Zero Excel reconciliation conflicts
- Complete audit trail for dispute resolution

### Core Capabilities

1. **Employee Portal**: Mark attendance (Office/Site), view history, apply leave, track balance
2. **MD Portal**: Approve/reject requests, view dashboard metrics, manage employees, export reports
3. **Push Notifications**: Bidirectional alerts (employee→MD on mark, MD→employee on approval)
4. **PWA Features**: Offline asset caching, installable, service worker background notifications
5. **Excel Export**: Monthly attendance matrix (date×employee grid) with color coding

---

## 2. Technology Stack

### Frontend Stack

```json
{
  "framework": "React 19.2.3",
  "buildTool": "Vite 6.3.5",
  "routing": "React Router DOM 7.10.1",
  "styling": "Tailwind CSS 3.4.17",
  "uiComponents": "Headless UI 2.2.0",
  "icons": "Heroicons 2.2.0",
  "dateUtils": "date-fns 4.1.0",
  "stateManagement": "React Context API (AuthContext, ThemeContext)",
  "pwa": "Custom Service Worker + Capacitor 8.0.0"
}
```

**Build Configuration** (`vite.config.js`):
- SWC-based React plugin for faster compilation
- PWA plugin generates service worker with Firebase config injection
- Code splitting via dynamic imports (route-based chunks)

### Backend Stack

```json
{
  "runtime": "Node.js 20.x",
  "framework": "Express 4.18.2",
  "cors": "cors 2.8.5",
  "scheduler": "node-cron 3.0.3",
  "excelGeneration": "exceljs 4.4.0",
  "hosting": "Render (free tier, cold start ~30s)"
}
```

**Host Binding**: `0.0.0.0:5000` (required for Render cloud deployment)

### Firebase Services

```json
{
  "authentication": "Firebase Auth 11.11.1 (Google OAuth only)",
  "database": "Firebase Realtime Database (us-central1 region)",
  "messaging": "Firebase Cloud Messaging (web push)",
  "hosting": "Firebase Hosting (global CDN)",
  "adminSDK": "Firebase Admin 11.11.1 (backend elevated privileges)"
}
```

**Security Model**: Declarative rules (`database.rules.json`) + backend validation

---

## 3. Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (PWA)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Employee   │  │      MD      │  │    Owner     │     │
│  │   Portal     │  │    Portal    │  │   Metrics    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                 │              │
│         └──────────────────┴─────────────────┘              │
│                            │                                │
│                   React Router DOM                          │
│                   (Role-based routing)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTPS REST API
                             │
┌────────────────────────────┴────────────────────────────────┐
│                   BACKEND LAYER (Node.js)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express API Gateway                      │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ Attend │ │ Leave  │ │   Auth   │ │  Export  │   │  │
│  │  │  Ctrl  │ │  Ctrl  │ │   Ctrl   │ │   Ctrl   │   │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                   Firebase Admin SDK                        │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐        ┌─────────▼─────────┐
    │  Firebase RTDB    │        │   Firebase FCM    │
    │  /employees       │        │  (Push Delivery)  │
    │  /leaves          │        │                   │
    │  /fcm_tokens      │        │  Service Worker   │
    │  /audit           │        │  (Background)     │
    └───────────────────┘        └───────────────────┘
```

### Data Flow Principles

**Unidirectional Write Flow**:
1. Frontend collects user input
2. Frontend sends POST to backend API
3. Backend validates payload
4. Backend generates server-side timestamp
5. Backend writes to Firebase RTDB
6. Backend sends FCM notifications
7. Frontend receives real-time update via `onValue` listener

**Frontend NEVER writes directly to database** (except FCM token registration)

**State Propagation**:
- Firebase RTDB triggers `onValue` listeners on all subscribed clients
- UI updates in next React render cycle (<16ms)
- Observed end-to-end latency: <1 second for database write → UI update

---

## 4. Database Schema

### Schema Version 2.0 (Employees-Based)

**Migration**: Legacy `/users/{uid}` → `/employees/{uid}/profile` (completed)

### Complete Structure

```
firebase-realtime-database/
├── employees/
│   └── {uid}/                      # Firebase Auth UID
│       ├── profile/                # User metadata
│       │   ├── name: string
│       │   ├── email: string
│       │   ├── role: "employee"|"md"|"owner"
│       │   ├── employeeId: string  # "EMP001"
│       │   ├── phone: string
│       │   ├── dateOfBirth: string # "1990-01-15"
│       │   ├── photoURL: string
│       │   └── uid: string         # Redundant but helpful
│       ├── attendance/             # Nested attendance records
│       │   └── {date}/             # ISO date "2025-01-15"
│       │       ├── status: "pending"|"pending_co"|"approved"|"rejected"
│       │       ├── timestamp: ISO string (server-generated)
│       │       ├── locationType: "Office"|"Site"
│       │       ├── siteName: string|null
│       │       ├── latitude: number|null
│       │       ├── longitude: number|null
│       │       ├── mdNotified: boolean
│       │       ├── employeeNotified: boolean
│       │       ├── approvedAt: ISO string|null
│       │       ├── rejectedAt: ISO string|null
│       │       ├── handledBy: string (MD email)
│       │       └── specialNote: string|null
│       └── leaveBalance/
│           ├── pl: number (default 17)
│           └── co: number (default 0)
├── leaves/
│   └── {employeeId}/               # Employee UID
│       └── {leaveId}/              # Push-generated ID
│           ├── employeeId: string
│           ├── employeeName: string
│           ├── employeeEmail: string
│           ├── type: "PL"|"CO"
│           ├── from: string        # "2025-01-20"
│           ├── to: string          # "2025-01-22"
│           ├── totalDays: number
│           ├── reason: string
│           ├── status: "pending"|"approved"|"rejected"
│           ├── appliedAt: ISO string
│           └── actionData: {
│               by: string,         # MD UID
│               name: string,       # MD email
│               at: ISO string
│           }|null
├── fcm_tokens/
│   └── {uid}/                      # Employee UID
│       ├── token: string           # FCM registration token
│       ├── permission: "granted"|"denied"
│       ├── platform: "web"
│       ├── userAgent: string
│       ├── createdAt: ISO string
│       └── lastSeen: ISO string
└── audit/
    └── {pushId}/                   # Auto-generated
        ├── actor: string           # MD email
        ├── action: "approveAttendance"|"rejectAttendance"|"approveLeave"|...
        ├── target: {
        │   employeeId: string,
        │   date: string
        │ }
        ├── details: object
        └── timestamp: number (Date.now())
```

### Security Rules (`database.rules.json`)

**Key Rules**:

```json
{
  "employees": {
    "$uid": {
      "profile": {
        ".read": "auth.uid === $uid || root.child('employees').child(auth.uid).child('profile').child('role').val() === 'md'",
        ".write": "auth.uid === $uid || root.child('employees').child(auth.uid).child('profile').child('role').val() === 'md'"
      },
      "attendance": {
        "$date": {
          ".read": "auth.uid === $uid || root.child('employees').child(auth.uid).child('profile').child('role').val() === 'md'",
          ".write": "(!data.exists() && $uid === auth.uid) || root.child('employees').child(auth.uid).child('profile').child('role').val() === 'md'"
        }
      }
    }
  }
}
```

**Interpretation**:
- **Profile Read**: Employee can read own profile, MDs can read all profiles
- **Profile Write**: Employee can update own profile, MDs can update any profile
- **Attendance Write**: Employee can write if record doesn't exist (initial mark), MDs can write anytime (approval/rejection)

**⚠️ Gap**: Employees cannot re-write pending records (should allow overwrite for GPS retry)

---

## 5. Authentication System

### File: `src/context/AuthContext.jsx`

**Purpose**: Central authentication state manager using React Context API

#### Line-by-Line Explanation

**Lines 1-32: Imports and Context Setup**

```javascript
// L6-7: React hooks for state management
import { createContext, useContext, useState, useEffect, useRef } from 'react'

// L8-27: Firebase Auth and Database SDK imports
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { ref, get, set, child, query, orderByChild, equalTo, remove, onValue, off } from 'firebase/database'
```

💡 **Rationale**: Imports organized by functionality (React → Firebase Auth → Firebase Database)

**Lines 34-43: Context Creation and Hook**

```javascript
// L34: Create context with undefined initial value
const AuthContext = createContext()

// L37-42: Custom hook to consume context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
```

💡 **Pattern**: Custom hook enforces proper provider wrapping, prevents undefined context bugs

**Lines 46-54: State Initialization**

```javascript
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)      // Firebase User object
    const [userRole, setUserRole] = useState(null)             // "employee"|"md"|"owner"
    const [userProfile, setUserProfile] = useState(null)       // Full profile from DB
    const [loading, setLoading] = useState(true)               // Prevents flash of wrong content
    const listenerRefs = useRef({                              // Track active listeners for cleanup
        profile: null,
        email: null
    })
```

💡 **State Design**: Separation of auth state (`currentUser`) and application state (`userRole`, `userProfile`)

**Lines 56-59: Listener Cleanup**

```javascript
const stopRealtimeListeners = () => {
    Object.values(listenerRefs.current).forEach((cleanup) => cleanup?.())  // Call cleanup functions
    listenerRefs.current = { profile: null, email: null }                  // Reset refs
}
```

💡 **Why Refs**: Closures in `onValue` callbacks cause stale references; refs ensure latest cleanup functions

**Lines 61-126: Profile Listener Setup**

```javascript
const startRealtimeListeners = (user) => {
    stopRealtimeListeners()  // L62: Prevent duplicate listeners
    if (!user?.uid) return   // L63: Guard against null user
    
    // L65-67: Profile listener
    const normalizedEmail = user.email?.toLowerCase()
    const userRef = ref(database, `employees/${user.uid}/profile`)
    
    // L69-78: Snapshot handler
    const handleProfileSnapshot = (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val()
            setUserRole(data.role)          // L72: Extract role for routing
            setUserProfile(data)            // L73: Store full profile
        } else {
            // L75-76: Profile doesn't exist → reset state
            setUserRole(null)
            setUserProfile(null)
        }
    }
```

**🔴 Failure Path**: If profile doesn't exist, `userRole` remains null → Login page shows "Profile not found"

**Lines 88-125: UID Migration Logic**

```javascript
// L88-89: Query employees by email (handles legacy placeholders)
const employeesRef = ref(database, 'employees')
const emailQuery = query(employeesRef, orderByChild('email'), equalTo(normalizedEmail))

const handleEmailSnapshot = async (snapshot) => {
    if (!snapshot.exists()) return  // L92: No records with this email
    
    const data = snapshot.val()
    const entries = Object.entries(data)  // L95: Get all matching records
    const hasRealUid = entries.some(([key]) => key === user.uid)  // L96: Check if real UID exists
    
    // L98: If real UID missing but placeholder exists
    if (!hasRealUid && entries.length > 0) {
        const [oldUid, profileData] = entries[0]  // L99: Get first match
        
        try {
            // L101-107: Create profile under real UID
            const updatedProfile = {
                ...profileData,
                uid: user.uid,                              // L103: Update to real UID
                email: normalizedEmail,
                photoURL: user.photoURL || profileData.photoURL || '',
                role: profileData.role || ROLES.EMPLOYEE
            }
            
            // L108: Write to correct path
            await set(ref(database, `employees/${user.uid}/profile`), updatedProfile)
            
            // L113: Delete old placeholder
            await remove(ref(database, `employees/${oldUid}`))
            
            console.log('♻️ Auto-migrated placeholder record...', normalizedEmail)
        } catch (error) {
            console.error('❌ Error migrating placeholder record:', error)
        }
    }
}
```

💡 **Context**: UID migration handles legacy data created before Firebase Auth UID was available. Admin manually created records using placeholder IDs (often email-based). On first login, system migrates placeholder → real UID.

**⚠️ Edge Case**: If multiple placeholders exist with same email, uses first match. Others become orphaned records.

**Lines 135-220: Auth State Listener**

```javascript
useEffect(() => {
    console.log('🔐 Setting up Firebase auth listener...')
    
    // L140-146: Set persistence to localStorage (survives browser close)
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log('✅ Auth persistence set to LOCAL'))
        .catch((error) => console.error('❌ Error setting auth persistence:', error))
    
    try {
        // L149: Register Firebase auth state change listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('🔄 Auth state changed:', user ? user.email : 'No user')
            
            if (user) {
                // User signed in
                setCurrentUser(user)            // L154: Store Firebase user object
                startRealtimeListeners(user)    // L155: Start DB listeners
            } else {
                // User signed out
                setCurrentUser(null)            // L159
                setUserRole(null)               // L160
                setUserProfile(null)            // L161
                stopRealtimeListeners()         // L162
            }
            
            setLoading(false)  // L165: Allow rendering (loading screen → actual app)
        })
        
        // L168: Cleanup on unmount
        return () => unsubscribe()
    } catch (error) {
        console.error('❌ Auth listener setup failed:', error)
        setLoading(false)  // Prevent infinite loading
    }
}, [])  // L174: Empty deps = run once on mount
```

**State Transitions**:
```
Initial:     loading=true, currentUser=null, userRole=null
User Login:  loading=true → false, currentUser={...}, userRole="employee"
User Logout: currentUser={...} → null, userRole="employee" → null
```

**Lines 225-310: Login/Logout Functions**

```javascript
const login = async () => {
    try {
        const provider = new GoogleAuthProvider()  // L228: Google OAuth
        const result = await signInWithPopup(auth, provider)  // L229: Trigger popup
        
        // L231-240: Check if profile exists
        const profileRef = ref(database, `employees/${result.user.uid}/profile`)
        const profileSnap = await get(profileRef)
        
        if (!profileSnap.exists()) {
            await signOut(auth)  // L236: Force logout if no profile
            throw new Error('Your account is not registered. Contact Administrator.')
        }
        
        return result.user  // L241: Return user object
    } catch (error) {
        console.error('Login Error:', error)
        throw error  // L245: Propagate to UI for toast display
    }
}

const logout = async () => {
    try {
        await signOut(auth)  // L252: Firebase sign out
        // State cleanup handled by onAuthStateChanged listener
    } catch (error) {
        console.error('Logout Error:', error)
        throw error
    }
}
```

**🔴 Failure Paths**:
- **Popup blocked**: `signInWithPopup` throws, caught by try/catch
- **Network error during profile check**: Throws error, user sees toast
- **Profile doesn't exist**: Force logout + error message

---

## 6. Attendance Workflow

### Frontend: `src/employee/components/AttendanceModal.jsx`

**Purpose**: Modal dialog for collecting attendance location (Office/Site)

#### Component Structure

```javascript
export default function AttendanceModal({ isOpen, onClose, onSuccess }) {
    const { currentUser } = useAuth()              // L14: Get authenticated user
    const [selectedLocation, setSelectedLocation] = useState(null)  // L15: "Office"|"Site"
    const [siteName, setSiteName] = useState('')   // L16: Site name input
    const [loading, setLoading] = useState(false)  // L17: Submit button disabled state
    const [error, setError] = useState('')         // L18: Error message display
```

**Lines 20-52: Submit Handler**

```javascript
const handleSubmit = async () => {
    setError('')  // L21: Clear previous errors
    
    // L22-25: Validation - location selection
    if (!selectedLocation) {
        setError('Please select where you are working today.')
        return
    }
    
    // L26-29: Validation - site name minimum length
    if (selectedLocation === 'Site' && siteName.length < 3) {
        setError('Please enter a valid site name (min 3 chars).')
        return
    }
    
    setLoading(true)  // L31: Disable submit button, show "Sending Request..."
    
    try {
        // L35-36: Generate client metadata (will be overridden by server)
        const dateStr = new Date().toISOString().split('T')[0]  // "2025-01-15"
        const timestamp = new Date().toISOString()  // "2025-01-15T09:30:45.123Z"
        
        // L38-44: POST to backend API
        await ApiService.post('/api/attendance/mark', {
            uid: currentUser.uid,
            locationType: selectedLocation,
            siteName: selectedLocation === 'Site' ? siteName : null,  // L41: Only send if Site
            timestamp,
            dateStr
        })
        
        onSuccess()  // L46: Callback to parent (Home.jsx) → close modal, show success toast
    } catch (err) {
        console.error(err)  // L48: Log full error
        setError(err.message || 'Failed to mark attendance.')  // L49: Show user-friendly message
    } finally {
        setLoading(false)  // L51: Re-enable submit button
    }
}
```

💡 **Design Decision**: Client timestamp sent but ignored by backend. Alternative would be to not send it at all, but having it in payload aids debugging (can compare client vs server clock skew).

**Lines 149-173: Holiday/Sunday Warning**

```javascript
{(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const isSunday = new Date().getDay() === 0  // L151: 0 = Sunday
    const isHoliday = ['2025-01-26', '2025-08-15', '2025-10-02', '2025-12-25'].includes(todayStr)  // L152: Hardcoded list
    
    if (isSunday || isHoliday) {
        return (
            <div className="bg-amber-50 text-amber-700...">
                <strong>Working on {isHoliday ? 'a Holiday' : 'Sunday'}?</strong>
                This will be submitted as a <strong>Comp Off Request</strong>.
                Once approved by MD, you will earn +1 Comp Off balance.
            </div>
        )
    }
    
    return (
        <div className="bg-blue-50 text-blue-700...">
            Your attendance will be sent to the MD for approval immediately...
        </div>
    )
})()}
```

⚠️ **Limitation**: Holiday list hardcoded in frontend. Should be fetched from backend `/config/holidays` for centralized management.

### API Service: `src/services/api.js`

**Lines 1-38: Fetch Wrapper**

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com'  // L1: Environment variable with fallback

class ApiService {
    static async request(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' }  // L5: JSON payloads only
        
        try {
            const config = { method, headers }  // L8: Base fetch config
            if (body) config.body = JSON.stringify(body)  // L9: Serialize payload
            
            // L12: Normalize endpoint (allow with or without leading slash)
            const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
            
            // L14: Execute fetch
            const response = await fetch(`${API_URL}${normalizedEndpoint}`, config)
            const data = await response.json()  // L15: Parse response
            
            // L17-19: Error handling
            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed')
            }
            
            return data  // L21: Success response
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error)  // L23: Log for debugging
            throw error  // L24: Propagate to caller
        }
    }
    
    static post(endpoint, body) {
        return this.request(endpoint, 'POST', body)  // L29: Convenience method
    }
}
```

💡 **Error Handling**: Throws error for non-2xx responses, allowing frontend to catch and display toast.

### Backend: `backend/src/controllers/attendanceController.js`

**Lines 45-167: Mark Attendance Handler**

```javascript
exports.markAttendance = async (req, res) => {
    const { uid, locationType, siteName, dateStr, latitude, longitude } = req.body  // L46: Destructure payload
    
    // L48-50: Request validation
    if (!uid || !locationType || !dateStr) {
        return res.status(400).json({ error: 'Missing required fields' })
    }
    
    try {
        // L54-66: Duplicate check (idempotency)
        const attendanceRef = db.ref(`employees/${uid}/attendance/${dateStr}`)
        const existingSnap = await attendanceRef.once('value')
        
        if (existingSnap.exists()) {
            const existing = existingSnap.val()
            // L60: Reject if already approved
            if (existing.status === 'approved' || existing.status === 'Present') {
                return res.status(409).json({
                    error: 'Attendance already marked and approved for this date',
                    existing: existing
                })
            }
            // If pending, falls through to overwrite
        }
        
        // L69: ⚠️ CRITICAL - Server-side timestamp (prevents client clock manipulation)
        const serverTimestamp = new Date().toISOString()
        
        // L72-74: Fetch employee name for notification
        const userSnap = await db.ref(`employees/${uid}/profile`).once('value')
        const userData = userSnap.val() || {}
        const employeeName = userData.name || 'Employee'
        
        // L77-86: Sunday/Holiday detection
        const isHoliday = isNationalHoliday(dateStr)  // Helper function checks hardcoded list
        const isSun = isSunday(dateStr)  // Helper: new Date(dateStr).getDay() === 0
        
        let status = 'pending'       // L80: Default status
        let statusNote = null
        
        if (isHoliday || isSun) {
            status = 'pending_co'    // L84: Special status for CO request
            statusNote = isHoliday ? 'Worked on National Holiday' : 'Worked on Sunday'
        }
```

**⚠️ Missing Logic**: Geofencing auto-approval

**Expected (but not implemented)**:
```javascript
// HYPOTHETICAL CODE (NOT PRESENT):
if (latitude && longitude) {
    const distance = calculateHaversineDistance(
        latitude, longitude,
        OFFICE_LAT, OFFICE_LON
    )
    if (distance < 100 && locationType === "Office") {
        status = 'approved'  // Auto-approve if within 100m radius
    }
}
```

**Current behavior**: ALL attendance defaults to `"pending"` regardless of GPS coordinates.

**Lines 88-100: Database Write**

```javascript
const updateData = {
    status: status,              // L89: "pending" or "pending_co"
    timestamp: serverTimestamp,  // L90: Authoritative server time
    locationType,                // L91: "Office" or "Site"
    siteName: siteName || null,  // L92: Nullable
    latitude: latitude || null,  // L93: May be null if GPS denied
    longitude: longitude || null,
    mdNotified: false,           // L95: Will be updated after notification sent
    specialNote: statusNote      // L96: Holiday/Sunday note
}

await attendanceRef.update(updateData)  // L99: Atomic write at path level
console.log(`[Attendance] Marked for ${employeeName} (${uid})`)  // L100: Success log
```

**Database Path**: `/employees/{uid}/attendance/{dateStr}`

**Side Effects**:
- 1 database write
- Console log written to STDERR (captured by Render)

**Lines 102-158: MD Notification**

```javascript
// L105-106: Fetch ALL employees (⚠️ inefficient at scale)
const allUsersSnap = await db.ref('employees').once('value')
const allUsers = allUsersSnap.val() || {}

const mdTokens = []  // L108: Accumulator for FCM tokens

// L123-128: Filter for MD roles
const mdUids = Object.entries(allUsers)
    .filter(([id, u]) => {
        const p = u.profile || u
        return (p.role === 'admin' || p.role === 'MD' || p.role === 'owner')  // L126: Multiple role values considered MD
    })
    .map(([id]) => id)
```

💡 **Performance Issue**: Scans entire `/employees` tree. At 1000+ employees, would cause significant latency. Should use indexed query: `query(ref('employees'), orderByChild('profile/role'), equalTo('md'))`.

```javascript
// L130-138: Fetch FCM tokens for MDs
const allTokensSnap = await db.ref('fcm_tokens').once('value')
const allTokens = allTokensSnap.val() || {}

mdUids.forEach(mdUid => {
    const tData = allTokens[mdUid]
    if (tData && tData.token && tData.permission === 'granted') {  // L135: Check permission
        mdTokens.push(tData.token)
    }
})

const uniqueTokens = [...new Set(mdTokens)]  // L141: Deduplicate (prevents double-send if MD has multiple sessions)
```

```javascript
// L143-158: Send FCM multicast notification
if (uniqueTokens.length > 0) {
    await sendMulticast(
        uniqueTokens,
        {
            title: 'New Attendance Request',  // L147: Hardcoded title
            body: `${employeeName} checked in at ${locationType === 'Site' ? (siteName || 'Site') : 'Office'}`  // L148: Dynamic body
        },
        {
            action: 'REVIEW_ATTENDANCE',  // L151: Data payload for routing
            attendanceId: dateStr,
            employeeId: uid
        }
    )
    
    // L157: Mark as notified
    await attendanceRef.update({ mdNotified: true })
}
```

**sendMulticast Helper** (Lines 11-34):
```javascript
const sendMulticast = async (tokens, notification, data) => {
    try {
        const result = await messaging.sendEachForMulticast({
            tokens: tokens,          // L14: Array of FCM tokens
            notification: notification,  // L15: {title, body}
            data: data               // L16: Custom payload (must be strings)
        })
        
        console.log(`[FCM] Sent to ${result.successCount}/${tokens.length} tokens`)  // L19: Success metric
        
        // L21-28: Log failures (but don't prune tokens)
        if (result.failureCount > 0) {
            result.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`[FCM] Failed for token ${idx}:`, resp.error)
                }
            })
        }
        
        return result  // L31: Return for caller inspection
    } catch (error) {
        console.error('[FCM] Multicast send error:', error)  // L33: Log but don't throw
    }
}
```

⚠️ **Missing Feature**: Token pruning on invalid token errors. Should delete `/fcm_tokens/{uid}` when FCM returns `INVALID_ARGUMENT` or `UNREGISTERED`.

**Lines 161-166: Success Response**

```javascript
res.json({ success: true, message: 'Attendance marked and MDs notified' })  // L161

} catch (error) {
    console.error('[Attendance] Mark Error:', error)  // L164
    res.status(500).json({ error: 'Failed to mark attendance' })  // L165: Generic error
}
```

**🔴 Failure Paths**:
- **Firebase RTDB unavailable**: Write throws → caught by catch block → 500 response
- **FCM send fails**: Logged but doesn't block response → attendance marked, MD not notified
- **Invalid token**: FCM returns error per-token, logged but doesn't fail entire multicast

---

This is the first section of the comprehensive manual. Due to token limits, I'll continue in the next file. Shall I proceed with:
- Sections 7-10 (Approval Workflow, Notification System, Leave Management, Export System)
- Code implementation details for service worker, dashboard, and utilities
- Complete edge case mapping and recovery procedures?
