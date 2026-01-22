# ATLAS Authentication Guide

**Purpose**: This document explains how authentication works in ATLAS in simple, clear terms.

---

## What is Authentication?

**Authentication** = Proving who you are  
**Authorization** = What you're allowed to do

In ATLAS:
- **Firebase Auth** proves who you are (Google account)
- **Backend** decides what you can do (employee vs MD)

---

## How It Works (Simple Explanation)

### Step 1: Sign In with Google

When you click "Sign In with Google":

1. A Google popup opens
2. You select your Google account
3. Google verifies your password (and 2FA if enabled)
4. Google tells Firebase "This person is verified"
5. Firebase gives you an **ID token** (like a digital badge)

**Your ID token contains**:
- Your unique ID (UID)
- Your email address
- Expiration time (1 hour)

---

### Step 2: Check if You're Allowed

Not everyone can access ATLAS. Only authorized employees can.

**How we check**:
1. When you sign in for the first time, a Cloud Function runs
2. It checks if your email is in our approved list (stored in Firestore)
3. **If NOT approved**: Your account is deleted immediately
4. **If approved**: We add your **role** to your token

**Roles**:
- `employee` - Can mark attendance, apply for leave
- `md` - Can do everything + approve/reject

---

### Step 3: Your Token Gets Updated

After approval, your token is updated with your role:

```
Before: { uid: "abc123", email: "john@company.com" }
After:  { uid: "abc123", email: "john@company.com", role: "employee" }
```

This role is **embedded in your token** (called a "custom claim").

**Important**: You cannot change your own role. It's set by the server.

---

### Step 4: Making Requests

Every time you do something (mark attendance, view data, etc.):

1. Your browser sends your ID token to the backend
2. Backend checks:
   - Is the token valid? (not expired, not fake)
   - Is the token revoked? (did you log out?)
   - What's your role? (employee or MD)
   - Is your account active? (not disabled)
3. **If all checks pass**: Action allowed
4. **If any check fails**: Action denied

---

### Step 5: Firestore Security Rules (Backup)

Even if the backend has a bug, Firestore has its own security:

**Example**: Employee tries to approve attendance
- Backend might have a bug and allow it
- But Firestore Rules will block it
- Only MD role can approve

This is called **defense in depth** - multiple security layers.

---

## Key Security Features

### 1. Email Whitelist
- Only pre-approved emails can sign in
- Unauthorized users are auto-deleted
- MD controls who has access

### 2. Role-Based Access
- Your role determines what you can do
- Roles stored on server (you can't change them)
- Checked on every request

### 3. Token Expiration
- Tokens expire after 1 hour
- Firebase automatically refreshes them
- You don't notice, it's seamless

### 4. Instant Logout
- When you log out, all your tokens become invalid
- Even if someone stole your token, it won't work
- We use "token versioning" for this

### 5. Server-Controlled Dates
- When you mark attendance, the server decides the date
- You can't backdate or mark future attendance
- Server uses IST timezone

---

## What Happens When You...

### Mark Attendance

1. You click "Mark Attendance" and select location
2. Frontend sends your token + location to backend
3. Backend:
   - Verifies your token
   - Checks you're an employee
   - Generates today's date (server time, IST)
   - Creates attendance record with status "pending"
4. MD gets notified to approve

**Security**: You can only mark your own attendance, only for today.

---

### Approve Attendance (MD Only)

1. MD clicks "Approve" on pending attendance
2. Frontend sends MD's token + record ID to backend
3. Backend:
   - Verifies MD's token
   - Checks role is "md"
   - Updates attendance status to "approved"
   - Logs the action
4. Employee gets notified

**Security**: Only MD can approve. Employees blocked by backend + Firestore Rules.

---

### Log Out

1. You click "Log Out"
2. Frontend signs you out of Firebase
3. Your token version is incremented
4. All your old tokens become invalid

**Result**: Even if someone has your old token, it won't work anymore.

---

## Security Layers (Defense in Depth)

We have **7 layers** of security:

1. **Firebase Auth** - Verifies your Google account
2. **Email Whitelist** - Only approved emails allowed
3. **Custom Claims** - Role embedded in token (can't be faked)
4. **Token Versioning** - Instant logout capability
5. **Cloud Functions** - Backend validates every request
6. **Firestore Rules** - Database blocks unauthorized access
7. **App Check** - Blocks bots and scripts

**If one layer fails, others catch it.**

---

## Common Questions

### Q: Can I change my own role?
**A**: No. Roles are set by the server. Even if you edit the frontend code, the backend will reject your requests.

### Q: What if my token is stolen?
**A**: Tokens expire in 1 hour. If you log out, all tokens become invalid immediately.

### Q: Can I mark attendance for yesterday?
**A**: No. The server generates the date. You can only mark attendance for today.

### Q: What if I'm not on the approved list?
**A**: You can't sign in. Your account will be deleted automatically.

### Q: How does MD approve attendance?
**A**: MD has a special "Approvals" page. They can select multiple pending records and approve/reject in bulk.

---

## Technical Details (For Developers)

### Token Structure
```json
{
  "uid": "abc123",
  "email": "john@company.com",
  "email_verified": true,
  "role": "employee",
  "token_version": 1,
  "exp": 1704445200
}
```

### Custom Claims
- `role`: "employee" or "md"
- `token_version`: Incremented on logout (for revocation)

### Firestore Collections
- `/users` - User profiles with roles
- `/attendance` - Attendance records
- `/audit_logs` - All actions logged

### Cloud Functions
- `onUserCreate` - Checks whitelist, sets role
- `markAttendance` - Creates attendance record
- `approveAttendance` - MD approves attendance

---

## Summary

**Authentication in ATLAS**:
1. Sign in with Google (identity)
2. Check email whitelist (authorization)
3. Get role in token (employee/MD)
4. Make requests with token
5. Backend validates every request
6. Firestore Rules backup enforcement

**Security**: Multiple layers, server-controlled, instant revocation, audit logging.

**Simple**: You sign in with Google. We check if you're allowed. You get a role. That's it.
