# ATLAS Authentication System: Complete Technical Reference

**Document Purpose**: This is the authoritative reference for ATLAS authentication. Written for the system author's future self to recall, explain, and defend this system in interviews and design discussions.

**Last Updated**: January 5, 2026  
**Status**: Phase 1 Implemented (Identity + Frontend Authorization)

---

## 1️⃣ Purpose of the Authentication System

### Why This Auth System Exists

ATLAS is an attendance tracking and leave application system for a small organization. The auth system exists to:

1. **Verify identity** - Ensure only authorized employees can access the system
2. **Control access** - Restrict features based on user roles (employee vs MD/owner)
3. **Prevent unauthorized access** - Block anyone not on the email whitelist
4. **Enable instant revocation** - Allow immediate logout/account disable across all devices

### Problems It Solves

1. **No password management** - Uses Google OAuth, eliminating password reset flows
2. **Email-based whitelist** - Only pre-approved emails can sign in
3. **Role-based access** - Different capabilities for employees vs management
4. **Session control** - Ability to invalidate all user sessions instantly

### Threats It Stops

**Currently Implemented**:
- ✅ Unauthorized email sign-in (email whitelist)
- ✅ Unauthenticated access to app (Firebase Auth)
- ✅ Account takeover via password (no passwords, Google OAuth only)

**NOT YET IMPLEMENTED** (Critical Gap):
- ❌ Frontend tampering (no backend enforcement)
- ❌ Token theft/replay attacks (no backend validation)
- ❌ Privilege escalation (frontend-only role checks)
- ❌ Direct Firestore access (no security rules deployed)

**IMPORTANT**: The current system provides **identity verification** but **NOT authorization enforcement**. Authorization is checked in frontend only, which is **NOT SECURE**.

---

## 2️⃣ High-Level Mental Model (Big Picture)

### What is Identity?

**Identity** = "Who are you?"

Firebase Auth answers this question by:
- Verifying you own a Google account
- Issuing a cryptographically signed ID token
- Storing your UID, email, and basic profile

**Firebase Auth ONLY handles identity**. It does NOT know about employees, MDs, or ATLAS-specific roles.

### What is Authorization?

**Authorization** = "What can you do?"

ATLAS authorization determines:
- Can you view attendance records?
- Can you approve leave requests?
- Can you manage users?

**Authorization is NOT handled by Firebase Auth**. It's ATLAS's responsibility.

### Where Firebase Auth Stops

Firebase Auth stops at:
```
✅ User signed in with Google
✅ ID token issued
✅ Token is cryptographically valid
❌ Does NOT check: role, permissions, whitelist
❌ Does NOT enforce: business logic
```

### Where ATLAS Logic Begins

ATLAS logic starts at:
```
✅ Check if email is whitelisted
✅ Assign role (employee/md)
✅ Embed role in token (custom claims)
✅ Check role before showing UI
❌ NOT YET: Enforce role on backend
❌ NOT YET: Validate token on every request
```

### Simple ASCII Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       ▼
┌──────────────────┐
│  Firebase Auth   │  ← Identity Provider
│  (Google OAuth)  │
└────────┬─────────┘
         │
         │ 2. Returns ID Token
         ▼
┌──────────────────┐
│  Cloud Function  │  ← ATLAS Backend
│  (onUserCreate)  │
└────────┬─────────┘
         │
         │ 3. Check email whitelist
         │ 4. Set custom claims (role, token_version)
         ▼
┌──────────────────┐
│    Firestore     │  ← Database
│  /users/{uid}    │
└──────────────────┘

User is now authenticated with role embedded in token
Frontend checks role to show/hide UI
⚠️  Backend does NOT yet enforce role
```

---

## 3️⃣ Complete End-to-End Flow (No Skipping)

### Step 1: User Clicks "Sign in with Google"

**Who**: User in browser  
**What**: `signInWithPopup(auth, googleProvider)` called  
**Data Created**: None yet  
**Why**: Initiate OAuth flow  
**Failure**: Popup blocked → user sees error, can retry

**Code Location**: `src/features/auth/services/authService.ts:15-28`

---

### Step 2: Google OAuth Popup Opens

**Who**: Firebase Auth SDK  
**What**: Opens Google account selection popup  
**Data Created**: None  
**Why**: Let user choose Google account  
**Failure**: User closes popup → `auth/popup-closed-by-user` error

**Config**: `googleProvider.setCustomParameters({ prompt: 'select_account' })`  
Forces account selection every time (no auto-login)

---

### Step 3: User Selects Google Account

**Who**: User  
**What**: Clicks on Google account in popup  
**Data Created**: None yet  
**Why**: Authorize ATLAS to access basic profile  
**Failure**: User denies → OAuth flow cancelled

---

### Step 4: Firebase Auth Issues ID Token

**Who**: Firebase Auth servers  
**What**: Creates cryptographically signed JWT token  
**Data Created**:
```javascript
{
  iss: "https://securetoken.google.com/atlas-011",
  aud: "atlas-011",
  sub: "user_uid_here",  // Unique user ID
  email: "user@example.com",
  email_verified: true,
  iat: 1704470400,  // Issued at
  exp: 1704474000,  // Expires in 1 hour
  // Custom claims NOT YET SET
}
```

**Why**: Prove user identity to backend  
**Failure**: Network error → user sees error, can retry

**Token Storage**: Stored in memory by Firebase SDK (NOT localStorage)

---

### Step 5: Cloud Function Triggered (onUserCreate)

**Who**: Firebase Cloud Functions  
**What**: `onCreate` trigger fires for new users  
**Data Checked**:
1. Does user have email?
2. Is email in `/users` collection?
3. Is user status `active`?

**Code Location**: `functions/src/auth/onUserCreate.ts:11-54`

**Why**: Enforce email whitelist  
**Failure Paths**:
- No email → Delete user, throw error
- Email not in whitelist → Delete user, log security event, throw error
- User status not `active` → Delete user, throw error

**Critical**: User is **deleted** if not whitelisted. They cannot sign in again.

---

### Step 6: Whitelist Check

**Who**: Cloud Function  
**What**: Query Firestore:
```javascript
usersRef
  .where('email', '==', email)
  .where('status', '==', 'active')
  .get()
```

**Data Read**: `/users` collection  
**Why**: Only pre-approved emails can access ATLAS  
**Failure**: `snapshot.empty` → User deleted, error thrown

**Firestore Document Structure**:
```javascript
/users/{uid} {
  email: "user@example.com",
  name: "John Doe",
  role: "employee",  // or "md"
  status: "active",  // or "disabled"
  token_version: 1,
  created_at: "2026-01-05T10:00:00.000Z",
  updated_at: "2026-01-05T10:00:00.000Z"
}
```

---

### Step 7: Set Custom Claims

**Who**: Cloud Function  
**What**: `admin.auth().setCustomUserClaims(uid, { role, token_version })`  
**Data Created**: Custom claims embedded in ID token  
**Why**: Embed role in token for fast frontend checks  
**Failure**: Firestore write fails → User can sign in but has no role

**After This Step, Token Contains**:
```javascript
{
  // ... standard fields ...
  role: "employee",  // or "md"
  token_version: 1
}
```

**Important**: Custom claims are **NOT immediately available**. User must refresh token or sign out/in.

---

### Step 8: Frontend Receives Authenticated User

**Who**: Frontend React app  
**What**: `onAuthStateChanged` callback fires  
**Data Received**: Firebase `User` object  
**Why**: Update UI to show authenticated state  
**Failure**: None (this always succeeds if user signed in)

**Code Location**: `src/features/auth/hooks/useAuth.ts:21-28`

**User Object Contains**:
```javascript
{
  uid: "abc123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  // Custom claims accessible via getIdTokenResult()
}
```

---

### Step 9: Email-Based Routing

**Who**: Frontend App component  
**What**: Check `user.email` and route accordingly  
**Data Checked**: Email address  
**Why**: Show different UI for owner vs other users  
**Failure**: None (always routes somewhere)

**Code Location**: `src/App.tsx:6-31`

**Routing Logic**:
```javascript
if (user.email === 'adityagchavan3@gmail.com') {
  return <OwnerPage />;  // Full access
} else {
  return <MaintenancePage />;  // Under maintenance
}
```

**CRITICAL SECURITY GAP**: This is **frontend-only** authorization. A malicious user can:
- Modify JavaScript to bypass this check
- Call backend APIs directly
- Access Firestore directly (if rules not deployed)

---

### Step 10: Protected Action (NOT YET IMPLEMENTED)

**What SHOULD Happen** (not implemented):
1. User clicks "Mark Attendance"
2. Frontend calls Cloud Function with ID token
3. Backend verifies token
4. Backend checks token_version
5. Backend checks role
6. Backend executes action

**What ACTUALLY Happens**:
- Frontend shows/hides UI based on email
- No backend enforcement
- No token validation
- No role checks on backend

**Code Location**: Backend functions not yet created (only `onUserCreate` and `verifyTokenVersion` helper exist)

---

## 4️⃣ Token Lifecycle (CRITICAL)

### How ID Tokens Are Issued

1. User signs in with Google
2. Firebase Auth creates JWT token
3. Token signed with Firebase private key
4. Token returned to client
5. Client stores token in memory (Firebase SDK handles this)

**Token is NOT stored in localStorage or sessionStorage**. It's held in memory by the Firebase SDK.

### What Data Tokens Contain

**Standard Claims** (always present):
```javascript
{
  iss: "https://securetoken.google.com/atlas-011",  // Issuer
  aud: "atlas-011",  // Audience (project ID)
  sub: "user_uid",  // Subject (user ID)
  email: "user@example.com",
  email_verified: true,
  iat: 1704470400,  // Issued at (Unix timestamp)
  exp: 1704474000,  // Expires at (1 hour later)
  auth_time: 1704470400,  // When user authenticated
  firebase: {
    identities: {
      "google.com": ["google_user_id"],
      email: ["user@example.com"]
    },
    sign_in_provider: "google.com"
  }
}
```

**Custom Claims** (added by ATLAS):
```javascript
{
  role: "employee",  // or "md"
  token_version: 1
}
```

**Total Token Size**: ~1-2 KB (Firebase limit: 1000 bytes for custom claims)

### How Custom Claims Are Added

1. User signs in for first time
2. `onUserCreate` Cloud Function fires
3. Function calls `admin.auth().setCustomUserClaims(uid, claims)`
4. Firebase updates user's token template
5. **Next time token refreshes**, custom claims appear

**CRITICAL**: Custom claims are **NOT immediately available** after setting. User must:
- Wait for token to expire and auto-refresh (1 hour), OR
- Call `user.getIdToken(true)` to force refresh, OR
- Sign out and sign in again

**Code Location**: `functions/src/auth/onUserCreate.ts:47-51`

### How Tokens Expire

**Expiration Time**: 1 hour from issuance

**What Happens at Expiry**:
1. Firebase SDK detects token expired
2. SDK automatically calls refresh token endpoint
3. New ID token issued with same claims
4. App continues working (user doesn't notice)

**User Never Manually Refreshes**: Firebase SDK handles this automatically.

### How Tokens Refresh

**Automatic Refresh**:
- Firebase SDK checks token expiry before each request
- If expired, SDK calls `https://securetoken.googleapis.com/v1/token`
- Refresh token (long-lived, stored securely by SDK) used to get new ID token
- New ID token has updated `iat` and `exp`, same claims

**Manual Refresh** (force):
```javascript
const token = await user.getIdToken(true);  // true = force refresh
```

**Why Force Refresh**:
- After custom claims are set
- After role change
- After token_version increment

### How Tokens Are Revoked

**ATLAS Uses Token Versioning** (not Firebase's built-in revocation):

**Firestore Document**:
```javascript
/users/{uid} {
  token_version: 1  // Increment this to revoke all tokens
}
```

**Custom Claim in Token**:
```javascript
{
  token_version: 1  // Must match Firestore
}
```

**Revocation Process**:
1. Admin increments `token_version` in Firestore (1 → 2)
2. User's token still has `token_version: 1`
3. Backend function calls `verifyTokenVersion(uid, 1)`
4. Function reads Firestore: `token_version: 2`
5. Mismatch detected → Throw `unauthenticated` error
6. User forced to sign out and sign in again
7. New token has `token_version: 2`

**Code Location**: `functions/src/auth/verifyTokenVersion.ts:11-41`

**Why This Works**:
- Token is still cryptographically valid
- Firebase Auth doesn't reject it
- But ATLAS backend rejects it
- Forces user to get new token with new version

### Why Logout Invalidates All Sessions

**Frontend Logout**:
```javascript
await authService.signOut();  // Calls Firebase signOut()
```

**What This Does**:
- Clears token from memory
- Clears refresh token
- User appears logged out in THIS browser

**What This Does NOT Do**:
- Invalidate tokens in other browsers
- Invalidate tokens on other devices
- Prevent token reuse if stolen

**To Invalidate All Sessions**:
1. Call `signOut()` on frontend
2. Backend increments `token_version` in Firestore
3. All existing tokens become invalid
4. User must sign in again on all devices

**NOT YET IMPLEMENTED**: Backend endpoint to increment token_version on logout.

---

## 5️⃣ Custom Claims & Roles

### What Custom Claims Are

**Custom claims** are key-value pairs embedded in the ID token by the backend.

**Standard JWT**:
```javascript
{
  sub: "user_uid",
  email: "user@example.com"
}
```

**With Custom Claims**:
```javascript
{
  sub: "user_uid",
  email: "user@example.com",
  role: "employee",  // ← Custom claim
  token_version: 1   // ← Custom claim
}
```

**Why Use Custom Claims**:
- Fast frontend checks (no database query)
- Embedded in token (can't be modified by user)
- Automatically included in every request

**Why NOT Use Custom Claims for Everything**:
- Limited size (1000 bytes total)
- Can't be updated instantly (requires token refresh)
- Should only contain stable, frequently-checked data

### Why Roles Are Embedded in Tokens

**Without Custom Claims** (slow):
```javascript
// Every page load
const userDoc = await firestore.collection('users').doc(uid).get();
const role = userDoc.data().role;
if (role === 'md') {
  showAdminUI();
}
```

**With Custom Claims** (fast):
```javascript
// No database query needed
const token = await user.getIdTokenResult();
if (token.claims.role === 'md') {
  showAdminUI();
}
```

**Performance Benefit**: No Firestore read on every page load.

### Why Roles Are NOT Trusted from Frontend

**Frontend Code** (user can modify):
```javascript
// User opens DevTools and runs:
localStorage.setItem('role', 'md');
// Now they see admin UI
```

**This is NOT a security issue IF**:
- Backend validates token on every request
- Backend checks role from token (not frontend)
- Firestore rules block direct access

**This IS a security issue IF** (current state):
- No backend validation
- No Firestore rules
- Frontend-only authorization

**CRITICAL**: ATLAS currently has frontend-only authorization. This is **NOT SECURE**.

### Why Claims Are Read at Runtime

**Custom claims are read from the token**, not from Firestore.

**Frontend**:
```javascript
const token = await user.getIdTokenResult();
const role = token.claims.role;  // From token, not Firestore
```

**Backend** (Cloud Functions):
```javascript
export const someFunction = functions.https.onCall(async (data, context) => {
  const role = context.auth.token.role;  // From verified token
  // ...
});
```

**Why**: Token is already verified by Firebase. No need to query Firestore.

### Why Firestore is Still the Source of Truth

**Custom claims are a CACHE**, not the source of truth.

**Source of Truth**:
```javascript
/users/{uid} {
  role: "employee"  // ← This is the truth
}
```

**Cached in Token**:
```javascript
{
  role: "employee"  // ← This is a copy
}
```

**When to Update**:
1. Admin changes role in Firestore
2. Increment `token_version`
3. User signs in again
4. New token has new role

**Why This Matters**:
- Role changes require re-authentication
- Can't instantly change user's role
- Must plan for this in UX

### Role Examples

**Employee**:
```javascript
{
  role: "employee",
  token_version: 1
}
```

**Can Do**:
- Mark own attendance
- Request leave
- View own records

**Cannot Do**:
- Approve leave
- View others' records
- Manage users

**MD (Managing Director)**:
```javascript
{
  role: "md",
  token_version: 1
}
```

**Can Do**:
- Everything employees can do
- Approve/reject leave
- View all records
- Manage user whitelist
- View audit logs

**NOT YET IMPLEMENTED**: Backend enforcement of these permissions.

---

## 6️⃣ Cloud Functions Authorization Logic

### How Firebase Verifies Tokens Automatically

**Cloud Functions (Callable)**:
```javascript
export const someFunction = functions.https.onCall(async (data, context) => {
  // Firebase AUTOMATICALLY verifies token before this runs
  // If token invalid, function never executes
  // context.auth is populated if token valid
});
```

**What Firebase Checks**:
1. Token signature valid (signed by Firebase)
2. Token not expired
3. Token audience matches project ID
4. Token issuer is Firebase Auth

**What Firebase Does NOT Check**:
- Token version
- User status (active/disabled)
- User role
- Custom business logic

### What context.auth Is

**If User Authenticated**:
```javascript
context.auth = {
  uid: "user_uid",
  token: {
    email: "user@example.com",
    email_verified: true,
    role: "employee",  // Custom claim
    token_version: 1   // Custom claim
  }
}
```

**If User NOT Authenticated**:
```javascript
context.auth = undefined
```

**How to Check**:
```javascript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
}
```

### What Is Checked on Every Request

**Currently Implemented** (in `verifyTokenVersion` helper):
```javascript
export async function verifyTokenVersion(uid: string, tokenVersion: number) {
  // 1. Check user exists
  const userDoc = await firestore.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();

  // 2. Check token version matches
  if (tokenVersion !== userData.token_version) {
    throw new functions.https.HttpsError('unauthenticated', 'Token revoked');
  }

  // 3. Check user is active
  if (userData.status !== 'active') {
    throw new functions.https.HttpsError('permission-denied', 'Account disabled');
  }
}
```

**NOT YET IMPLEMENTED**: Calling this helper in actual Cloud Functions.

### Why Some Checks Use Claims

**Fast Checks** (use claims):
- Role check: `if (context.auth.token.role === 'md')`
- No database query needed
- Instant

**When to Use**:
- Frequent checks
- Stable data (role doesn't change often)
- Performance-critical paths

### Why Some Checks Use Firestore

**Authoritative Checks** (use Firestore):
- Token version: Must match database
- User status: Must be `active`
- Permissions: May change frequently

**When to Use**:
- Security-critical checks
- Data that changes frequently
- When claims might be stale

### How Failures Are Handled

**Firebase Errors**:
```javascript
throw new functions.https.HttpsError(
  'unauthenticated',  // Error code
  'Token has been revoked'  // User-facing message
);
```

**Error Codes**:
- `unauthenticated`: Not signed in or token invalid
- `permission-denied`: Signed in but not authorized
- `not-found`: Resource doesn't exist
- `invalid-argument`: Bad input data

**Frontend Handling**:
```javascript
try {
  await functions.httpsCallable('someFunction')();
} catch (error) {
  if (error.code === 'unauthenticated') {
    // Redirect to login
  } else if (error.code === 'permission-denied') {
    // Show "Access Denied" message
  }
}
```

**NOT YET IMPLEMENTED**: Actual Cloud Functions that use this error handling.

---

## 7️⃣ Firestore Security Rules (Enforcement Layer)

### Why Rules Exist Even with Cloud Functions

**Defense in Depth**: Multiple layers of security.

**Scenario**: Cloud Function has a bug that allows unauthorized access.

**Without Rules**:
```javascript
// Buggy Cloud Function
export const getData = functions.https.onCall(async (data, context) => {
  // Oops, forgot to check role!
  return firestore.collection('sensitive').get();
});
```
Result: User gets sensitive data.

**With Rules**:
```javascript
// Firestore Rules
match /sensitive/{doc} {
  allow read: if request.auth.token.role == 'md';
}
```
Result: Firestore blocks the read, even though function allowed it.

### What Rules Protect Against

1. **Buggy Cloud Functions**: Function forgets to check permissions
2. **Direct Firestore Access**: User bypasses Cloud Functions entirely
3. **Client SDK Abuse**: User uses Firestore SDK directly from browser
4. **Compromised Backend**: Attacker gains access to Cloud Function code

### What Happens If Backend Logic Fails

**Example**: Cloud Function allows unauthorized write.

```javascript
// Buggy function
export const updateUser = functions.https.onCall(async (data, context) => {
  // Forgot to check if user is MD!
  await firestore.collection('users').doc(data.uid).update(data);
});
```

**Without Rules**: Write succeeds, data corrupted.

**With Rules**:
```javascript
match /users/{uid} {
  allow write: if request.auth.uid == uid  // Can only update own doc
                || request.auth.token.role == 'md';  // Or be MD
}
```

**Result**: Firestore rejects the write with `permission-denied`.

### How Rules Block Direct Firestore Abuse

**Scenario**: User opens browser DevTools and runs:
```javascript
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const users = await getDocs(collection(db, 'users'));
// Trying to read all users
```

**Without Rules**: User gets all user data.

**With Rules**:
```javascript
match /users/{uid} {
  allow read: if request.auth.uid == uid  // Can only read own doc
              || request.auth.token.role == 'md';  // Or be MD
}
```

**Result**: Firestore blocks the read. User gets `permission-denied`.

### Rules as Backend-Side Guards

**Think of Rules as**:
- Last line of defense
- Database-level firewall
- Always-on security
- Independent of application code

**NOT a Replacement for**:
- Cloud Function authorization
- Business logic validation
- Input sanitization

**Example Rules** (not yet deployed):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    function isMD() {
      return request.auth.token.role == 'md';
    }
    
    function isActive() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }
    
    // Users collection
    match /users/{uid} {
      allow read: if isAuthenticated() && (isOwner(uid) || isMD());
      allow write: if isMD();  // Only MDs can create/update users
    }
    
    // Attendance collection
    match /attendance/{id} {
      allow read: if isAuthenticated() && isActive();
      allow create: if isAuthenticated() && isActive() && isOwner(request.resource.data.uid);
      allow update, delete: if isMD();
    }
  }
}
```

**NOT YET DEPLOYED**: These rules are designed but not yet deployed to Firebase.

---

## 8️⃣ App Check & Bot Protection

### What App Check Does

**App Check** verifies requests come from your genuine app, not a bot or attacker.

**How It Works**:
1. App registers with Firebase App Check
2. App Check issues short-lived token (1 hour)
3. Every request includes App Check token
4. Firebase verifies token before processing request

**What It Blocks**:
- Automated bots scraping data
- Attackers using curl/Postman to call APIs
- Malicious scripts running outside your app

### What It Does NOT Block

**App Check Does NOT Prevent**:
- Authenticated users abusing APIs
- Users with valid tokens making unauthorized requests
- Privilege escalation (user changing their role)
- Business logic bugs

**Example**: User with valid App Check token and valid ID token can still:
- Call Cloud Functions they shouldn't access
- Read Firestore data if rules are weak
- Exploit bugs in your code

### Why It Is Still Required

**Defense in Depth**: App Check is ONE layer, not the ONLY layer.

**Layers of Security**:
1. App Check: Is this request from my app?
2. Firebase Auth: Is this user authenticated?
3. Custom Claims: What role does this user have?
4. Cloud Functions: Is this action allowed?
5. Firestore Rules: Is this data access allowed?

**All layers must be present** for complete security.

### NOT YET IMPLEMENTED

App Check is **NOT enabled** in ATLAS.

**To Enable**:
1. Register app with App Check in Firebase Console
2. Add App Check SDK to frontend
3. Enforce App Check on Cloud Functions and Firestore

**Current Risk**: Anyone can call ATLAS APIs with curl/Postman if they have a valid ID token.

---

## 9️⃣ Logout, Role Change & Account Disable

### What Happens on Logout

**Frontend Logout**:
```javascript
await authService.signOut();
```

**Steps**:
1. Firebase SDK clears ID token from memory
2. Firebase SDK clears refresh token
3. `onAuthStateChanged` fires with `user = null`
4. React state updated: `setUser(null)`
5. User redirected to login page

**What Is NOT Cleared**:
- Tokens on other devices
- Tokens in other browsers
- Tokens stored by attacker (if stolen)

### Why Token Version Increments

**Scenario**: User reports phone stolen.

**Admin Action**:
```javascript
// Increment token_version in Firestore
await firestore.collection('users').doc(uid).update({
  token_version: admin.firestore.FieldValue.increment(1)
});
```

**Result**:
- User's old tokens have `token_version: 1`
- Firestore now has `token_version: 2`
- Backend calls `verifyTokenVersion(uid, 1)`
- Mismatch detected → Token rejected
- Stolen phone can't access ATLAS
- User signs in on new device → Gets `token_version: 2`

**NOT YET IMPLEMENTED**: Admin UI to increment token_version.

### How Role Change Forces Re-Authentication

**Scenario**: Employee promoted to MD.

**Admin Action**:
```javascript
// Update role in Firestore
await firestore.collection('users').doc(uid).update({
  role: 'md',
  token_version: admin.firestore.FieldValue.increment(1)
});
```

**Why Increment token_version**:
- User's token still has `role: 'employee'`
- Custom claims don't update automatically
- Incrementing token_version forces re-authentication
- New token has `role: 'md'`

**Alternative** (without token_version increment):
- User must wait 1 hour for token to expire
- Or manually sign out and sign in
- Or call `user.getIdToken(true)` to force refresh

**Best Practice**: Always increment token_version when changing role.

### How Account Disable Blocks Access Instantly

**Scenario**: Employee terminated.

**Admin Action**:
```javascript
await firestore.collection('users').doc(uid).update({
  status: 'disabled',
  token_version: admin.firestore.FieldValue.increment(1)
});
```

**Result**:
- User's token still valid (Firebase doesn't know about disable)
- Backend calls `verifyTokenVersion(uid, tokenVersion)`
- Function checks `status === 'active'`
- Status is `disabled` → Throw `permission-denied`
- User blocked from all actions

**Why This Works**:
- Backend checks status on every request
- No need to wait for token expiry
- Instant revocation

**NOT YET IMPLEMENTED**: Backend functions don't call `verifyTokenVersion` yet.

---

## 🔥 10️⃣ Threat Model (MANDATORY)

### What If Frontend Is Modified?

**Attack**: User opens DevTools, modifies JavaScript to bypass role checks.

```javascript
// Attacker runs in console:
if (user.email === 'attacker@example.com') {
  user.email = 'adityagchavan3@gmail.com';  // Fake owner email
}
```

**Current Defense**: ❌ **NONE**

**Why It Works**:
- Frontend-only authorization
- No backend validation
- Email check is client-side only

**Proper Defense** (not implemented):
- Backend validates token on every request
- Backend checks role from token (not frontend)
- Firestore rules block unauthorized access

**Impact**: Attacker sees owner UI, but can't actually do anything if backend is secured.

### What If Token Is Stolen?

**Attack**: Attacker steals ID token from network traffic or XSS.

**Current Defense**: ⚠️ **PARTIAL**

**What Attacker Can Do**:
- Use token to authenticate as victim
- Call Cloud Functions as victim
- Access Firestore as victim (if rules weak)

**What Attacker Cannot Do**:
- Steal refresh token (stored securely by Firebase SDK)
- Use token after it expires (1 hour)
- Use token after token_version incremented

**Proper Defense** (partially implemented):
- ✅ Tokens expire in 1 hour
- ✅ Token versioning allows instant revocation
- ❌ No backend validation yet
- ❌ No Firestore rules yet

**Mitigation**:
- Use HTTPS (prevents network sniffing)
- Sanitize inputs (prevents XSS)
- Increment token_version if breach suspected

### What If User Replays Requests?

**Attack**: User captures valid request, replays it multiple times.

**Example**: Mark attendance request replayed 10 times.

**Current Defense**: ❌ **NONE**

**Why It Works**:
- No idempotency checks
- No request deduplication
- No rate limiting

**Proper Defense** (not implemented):
- Use idempotency keys
- Check for duplicate requests (same timestamp, same user)
- Implement rate limiting (max 1 attendance per day)

**Impact**: User could mark attendance multiple times, corrupt data.

### What If User Is Malicious But Authenticated?

**Attack**: Legitimate user tries to abuse system.

**Example**: Employee tries to approve their own leave request.

**Current Defense**: ❌ **NONE**

**Why It Works**:
- No backend authorization
- No business logic validation
- Frontend-only checks

**Proper Defense** (not implemented):
- Backend checks: "Is this user allowed to approve leave?"
- Backend validates: "Is user approving their own request?"
- Firestore rules block unauthorized writes

**Impact**: User could escalate privileges, corrupt data.

### What If a Cloud Function Has a Bug?

**Attack**: Cloud Function has logic error that allows unauthorized access.

**Example**:
```javascript
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Bug: Forgot to check if caller is MD!
  await firestore.collection('users').doc(data.uid).delete();
});
```

**Current Defense**: ❌ **NONE**

**Why It Works**:
- No Firestore rules to block delete
- No defense in depth

**Proper Defense** (not implemented):
```javascript
// Firestore Rules
match /users/{uid} {
  allow delete: if request.auth.token.role == 'md';  // Only MDs can delete
}
```

**Impact**: Bug in Cloud Function blocked by Firestore rules.

---

## 11️⃣ Comparison: Firebase vs Express (Brief)

### What Would Be Middleware in Express

**Express**:
```javascript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, SECRET_KEY);
  req.user = decoded;
  next();
}

app.post('/api/attendance', authMiddleware, (req, res) => {
  // req.user is populated
});
```

### What Replaces It in Firebase

**Firebase Cloud Functions**:
```javascript
export const markAttendance = functions.https.onCall(async (data, context) => {
  // context.auth is populated automatically
  // Firebase already verified token
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }
  // ...
});
```

**Key Differences**:
1. **No middleware needed**: Firebase verifies token automatically
2. **No JWT library needed**: Firebase handles JWT verification
3. **No secret key management**: Firebase manages keys
4. **context.auth always present**: If token valid, context.auth populated

### Why This Architecture Is Still Secure

**Firebase Handles**:
- Token signature verification
- Token expiry checks
- Token issuer validation
- Secure key management

**ATLAS Must Handle**:
- Token version validation
- User status checks
- Role-based authorization
- Business logic validation

**Security Equivalent to Express**: Yes, if implemented correctly.

**Current State**: Not yet secure (missing backend enforcement).

---

## 12️⃣ Common Misconceptions (IMPORTANT)

### "Frontend Checks Are Security"

**Misconception**: "I check the role in React, so only MDs can see admin UI."

**Reality**: Frontend checks are **UI/UX**, not security.

**Why**:
- User can modify JavaScript
- User can call APIs directly
- User can bypass React entirely

**Correct Approach**:
- Frontend checks: Show/hide UI
- Backend checks: Enforce permissions

### "Firebase Auth Handles Authorization"

**Misconception**: "Firebase Auth knows about roles and permissions."

**Reality**: Firebase Auth only handles **identity**, not authorization.

**What Firebase Auth Does**:
- ✅ Verify user owns Google account
- ✅ Issue cryptographically signed token
- ✅ Verify token signature

**What Firebase Auth Does NOT Do**:
- ❌ Know about ATLAS roles (employee/md)
- ❌ Enforce business logic
- ❌ Check permissions

**Correct Approach**:
- Firebase Auth: Identity
- ATLAS Backend: Authorization

### "Security Rules Are Optional"

**Misconception**: "I have Cloud Functions, I don't need Firestore rules."

**Reality**: Rules are **required** for defense in depth.

**Why**:
- Cloud Functions can have bugs
- Users can bypass Cloud Functions
- Rules are last line of defense

**Correct Approach**:
- Cloud Functions: Primary authorization
- Firestore Rules: Backup authorization

### "Logout Just Means signOut()"

**Misconception**: "Calling signOut() logs user out everywhere."

**Reality**: signOut() only clears token in **current browser**.

**What signOut() Does**:
- ✅ Clear token from memory
- ✅ Clear refresh token
- ✅ Update UI to logged-out state

**What signOut() Does NOT Do**:
- ❌ Invalidate tokens on other devices
- ❌ Prevent token reuse if stolen
- ❌ Revoke tokens globally

**Correct Approach**:
- signOut() + increment token_version
- Forces re-authentication everywhere

---

## 13️⃣ One-Page Verbal Explanation (Interview Mode)

**"Explain ATLAS authentication in 2-3 minutes."**

---

ATLAS uses Firebase Auth for identity and custom backend logic for authorization.

**Identity Flow**:
When a user signs in, they authenticate with Google OAuth through Firebase. Firebase issues a cryptographically signed ID token that proves their identity. This token contains their email and a unique user ID.

**Whitelist Enforcement**:
We have a Cloud Function that triggers on first sign-in. It checks if the user's email exists in our Firestore whitelist. If not, we immediately delete the user and reject the sign-in. This ensures only pre-approved employees can access the system.

**Custom Claims**:
For whitelisted users, we embed their role (employee or MD) and a token version number directly into their ID token as custom claims. This allows fast frontend checks without database queries, while still being tamper-proof since the token is cryptographically signed.

**Token Versioning**:
We use token versioning for instant logout. Each user has a version number in Firestore. When we need to revoke access—like if a device is stolen—we increment that version number. The user's existing tokens still have the old version, so our backend rejects them. The user must sign in again to get a new token with the updated version.

**Authorization**:
Currently, we're in Phase 1 where authorization is frontend-only—we check the user's email to route them to different pages. This is not secure for production. Phase 2 will add backend enforcement where every Cloud Function validates the token version, checks the user's status, and enforces role-based permissions.

**Defense in Depth**:
Our final architecture will have multiple layers: Firebase Auth verifies identity, Cloud Functions enforce business logic, and Firestore Security Rules act as a database-level firewall. Even if one layer fails, the others protect the system.

**Key Insight**:
Firebase Auth handles identity—proving who you are. ATLAS handles authorization—determining what you can do. These are separate concerns, and both must be implemented correctly for security.

---

## 📊 Implementation Status

### ✅ Implemented (Phase 1)

- Google OAuth sign-in
- Email whitelist enforcement
- Custom claims (role + token_version)
- Frontend auth state management
- Email-based routing
- Token versioning helper function

### ❌ Not Yet Implemented (Phase 2)

- Backend token validation on every request
- Role-based authorization in Cloud Functions
- Firestore Security Rules deployment
- App Check enforcement
- Admin UI for user management
- Audit logging
- Rate limiting

### 🔴 Critical Security Gaps

1. **No backend authorization**: Frontend-only role checks
2. **No Firestore rules**: Direct database access possible
3. **No token validation**: Backend doesn't verify token_version
4. **No App Check**: APIs callable from anywhere

**PRODUCTION READINESS**: ❌ **NOT READY**

This system provides identity verification but lacks authorization enforcement. Do not use in production until Phase 2 is complete.

---

## 🎯 Success Criteria

After reading this document, you should be able to:

✅ Explain the difference between identity and authorization  
✅ Describe the complete sign-in flow step-by-step  
✅ Explain how custom claims work and why they're used  
✅ Describe how token versioning enables instant logout  
✅ Identify what's implemented vs what's missing  
✅ Explain why frontend checks are not security  
✅ Defend the architecture in a technical interview  
✅ Identify security gaps and how to fix them  

**No unanswered questions should remain.**

---

**End of Document**
