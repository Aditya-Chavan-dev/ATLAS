# ATLAS Project - Issues Log

## Overview
This document tracks all issues encountered during development and deployment of the ATLAS Attendance System, along with their solutions.

---

## Issue #1: Firebase Authentication API Key Invalid
**Date**: 2025-12-12  
**Severity**: Critical  
**Status**: ✅ Resolved

### Problem
Firebase authentication was failing with error:
```
auth/api-key-not-valid.-please-pass-a-valid-api-key.
GET https://identitytoolkit.googleapis.com/v1/projects?key=... 400 (Bad Request)
```

### Root Cause
- Old/invalid API key was cached in browser and service worker
- PWA service worker was aggressively caching the `firebase-config.json` file
- Even after rebuilding with correct API key, browser served cached version

### Solution
1. **Cleaned build artifacts**:
   ```bash
   Remove-Item -Recurse -Force dist
   Remove-Item -Force public\config\firebase-config.json
   ```

2. **Rebuilt application**:
   ```bash
   npm run build
   ```

3. **Verified generated config** contained correct API key

4. **Deployed to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

5. **User action required**: Clear browser cache and service worker
   - DevTools → Application → Clear storage
   - Hard refresh (Ctrl+Shift+R)
   - Or test in incognito mode

### Prevention
- Always clear browser cache after Firebase config changes
- Test in incognito mode first
- Consider cache-busting for config files

### Files Modified
- `src/firebase/config.js` - Added freeze protection
- `public/config/firebase-config.json` - Regenerated with correct key

### Related Documentation
- `AUTH_FROZEN.md` - Authentication system freeze documentation
- `deployment_walkthrough.md` - Deployment guide

---

## Issue #2: Render Backend Not Going Live
**Date**: 2025-12-12  
**Severity**: High  
**Status**: ✅ Resolved

### Problem
Render backend showed "Incoming requests detected" but never went live. Server was failing to start.

### Root Cause
1. **Firebase initialization crash**: `firebase.js` had `process.exit(1)` that crashed server if env vars were missing
2. **Missing host binding**: Server wasn't binding to `0.0.0.0` (required for Render)
3. **Poor error logging**: No visibility into startup failures

### Solution

#### 1. Fixed Firebase Configuration (`backend/src/config/firebase.js`)
- Removed `process.exit(1)` calls
- Changed to throw errors instead of exiting
- Added comprehensive startup logging
- Server now starts even if Firebase fails (shows error in logs)

#### 2. Updated Server Binding (`backend/server.js`)
- Added `HOST = '0.0.0.0'` binding
- Enhanced startup logging
- Added graceful shutdown handlers
- Better cron job logging

### Code Changes

**Before**:
```javascript
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('Missing config');
    process.exit(1); // ❌ Crashes entire server
}

app.listen(PORT, () => { ... }); // ❌ No host binding
```

**After**:
```javascript
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('Missing config');
    throw new Error('Required'); // ✅ Throws error, server can handle
}

app.listen(PORT, '0.0.0.0', () => { ... }); // ✅ Binds to all interfaces
```

### Verification
Server now shows detailed logs:
```
🚀 Starting ATLAS Backend Server...
🔧 Initializing Firebase Admin SDK...
✅ Firebase credential loaded
✅ Firebase Admin SDK initialized successfully
═══════════════════════════════════════════
🚀 ATLAS Backend Server is LIVE!
═══════════════════════════════════════════
```

### Files Modified
- `backend/src/config/firebase.js`
- `backend/server.js`

### Related Documentation
- `backend/RENDER_FIX.md` - Render deployment troubleshooting guide

---

## Issue #3: MD User Redirected to Employee Side
**Date**: 2025-12-12  
**Severity**: High  
**Status**: ✅ Resolved

### Problem
User `chavan500@gmail.com` was in MD allowlist but being redirected to employee dashboard instead of MD dashboard.

### Root Cause
Database role was taking precedence over MD allowlist. If user existed in database with `role: 'employee'`, that role was used even though email was in MD allowlist.

### Solution
Modified `src/context/AuthContext.jsx` to give MD allowlist **absolute priority**:

1. **Check MD allowlist FIRST** before checking database
2. **Override database role** if user is in MD allowlist
3. **Create MD profile** if doesn't exist
4. **Update both login flow and auth state listener**

### Code Changes

**Login Flow**:
```javascript
// Check MD allowlist first - ABSOLUTE PRIORITY
if (isMD(email)) {
    role = ROLES.MD;
    
    // Override database role if needed
    if (profileData.role !== ROLES.MD) {
        profileData.role = ROLES.MD;
        await set(ref(database, `users/${user.uid}`), {
            ...profileData,
            role: ROLES.MD
        });
    }
}
```

**Auth State Listener**:
```javascript
// Check if user is in MD allowlist - override database role
if (isMD(user.email)) {
    if (profileData.role !== ROLES.MD) {
        profileData.role = ROLES.MD;
        await set(ref(database, `users/${user.uid}`), {
            ...profileData,
            role: ROLES.MD
        });
    }
}
```

### Verification
Console logs show:
```
👑 MD user logged in: chavan500@gmail.com
🔄 Updating database role from employee to MD
✅ Created MD profile in database
```

### Files Modified
- `src/context/AuthContext.jsx`

### Related Files
- `src/md/config/mdAllowList.js` - MD email allowlist

---

## Issue #4: Profile Section Not Loading
**Date**: 2025-12-12  
**Severity**: Medium  
**Status**: ✅ Resolved

### Problem
Profile section showed loading spinner indefinitely and never displayed user data.

### Root Cause
MD users weren't getting profile data created/loaded properly during authentication flow.

### Solution
Enhanced authentication flow to ensure MD users always get profile data:

1. **Create MD profile on login** if doesn't exist
2. **Auth state listener creates MD profiles** if missing
3. **Start realtime listeners** for all users
4. **Guarantee profile data** is available before rendering

### Code Changes
```javascript
// If MD user has no profile, create one
if (isMD(user.email)) {
    const mdProfile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'MD',
        photoURL: user.photoURL || '',
        role: ROLES.MD,
        phone: ''
    };
    await set(ref(database, `users/${user.uid}`), mdProfile);
    setUserProfile(mdProfile);
    startRealtimeListeners(user);
}
```

### Files Modified
- `src/context/AuthContext.jsx`

---

## Issue #5: Excel Export Not Downloading
**Date**: 2025-12-12  
**Severity**: High  
**Status**: ✅ Resolved

### Problem
Master Excel sheet download failed with error:
```json
{"error":"Failed to generate report","details":"admin.database is not a function"}
```

### Root Cause
Incorrect Firebase import in `exportController.js`. The controller was importing the entire module object instead of destructuring the admin and db references.

### Solution

**Before (Incorrect)**:
```javascript
const admin = require('../config/firebase');
// admin is { admin, db, messaging } - an object!
admin.database() // ❌ Fails - admin.database is undefined
```

**After (Correct)**:
```javascript
const { admin, db } = require('../config/firebase');
// Destructured - db is the initialized database reference
db.ref('users') // ✅ Works!
```

### Changes Made
1. Fixed import statement to use destructuring
2. Replaced all `admin.database().ref()` with `db.ref()`
3. Uses pre-initialized database reference from config

### Files Modified
- `backend/src/controllers/exportController.js`

---

## Issue #6: Excel Format Improvements
**Date**: 2025-12-12  
**Severity**: Low  
**Status**: ✅ Resolved

### Problem
Excel export needed formatting improvements:
- No bold fonts
- Sundays not highlighted in yellow
- Column widths not adjusted properly
- Data not clearly visible

### Solution
Enhanced Excel formatting in `backend/src/controllers/exportController.js`:

#### 1. Bold Fonts Everywhere
- Title row: Bold, size 16
- Subtitle row: Bold, size 14
- Header row: Bold
- Date column: Bold, size 11
- All data cells: Bold, size 10

#### 2. Yellow Highlight for Sundays
- Date column: Yellow background on Sundays
- All employee cells: Yellow background on Sundays
- Color: `#FFFF00` (bright yellow)

#### 3. Dynamic Column Widths
```javascript
employees.forEach((emp, index) => {
    const empName = (emp.name || emp.email).toUpperCase();
    const nameLength = empName.length;
    const columnWidth = Math.max(12, Math.min(25, nameLength + 2));
    worksheet.getColumn(index + 2).width = columnWidth;
});
```

#### 4. Row Heights
- Title row: 25
- Subtitle row: 20
- Header row: 20
- Data rows: Default

#### 5. Additional Formatting
- Black borders on all cells
- Center alignment for all cells
- Green highlight for leaves (`#90EE90`)
- Gray header background (`#D3D3D3`)

### Excel Structure
```
Row 1: Autoteknic (merged, bold, size 16)
Row 2: Attendance Dec 2025 (merged, bold, size 14)
Row 3: DATE | EMPLOYEE1 | EMPLOYEE2 | ... (bold, gray bg)
Row 4+: Data with formatting
```

### Cell Values
- `OFFICE` - Office attendance
- `SITE NAME` - Site attendance (e.g., "KTFL CHAKAN")
- `H` - Holiday (Sundays) - Yellow background
- `L` - Leave - Green background
- Empty - No attendance/absent

### Files Modified
- `backend/src/controllers/exportController.js`

---

## Issue #8: Build Failure - Invalid Firebase Messaging Import
**Date**: 2025-12-13  
**Severity**: Critical  
**Status**: ✅ Resolved

### Problem
`npm run build` was failing during the Vite transformation phase with a cryptic Rollup error:
```
G:/ATLAS/src/firebase/config.js:4:34
at file:///G:/ATLAS/node_modules/rollup/dist/es/shared/node-entry.js:21550:26
```

### Root Cause
`src/firebase/config.js` was importing `onBackgroundMessage` from `firebase/messaging`:

```javascript
// ❌ INVALID - onBackgroundMessage doesn't exist in firebase/messaging
import { getMessaging, onMessage, onBackgroundMessage } from 'firebase/messaging';
```

`onBackgroundMessage` is **only available in the service worker context** via `firebase/messaging/sw`, not in the main application bundle.

### Solution
Removed the invalid import and associated handler code:

**Before**:
```javascript
import { getMessaging, onMessage, onBackgroundMessage } from 'firebase/messaging';

// ... later in file ...
onBackgroundMessage(messaging, (payload) => {
    console.log('🔗 Notification click action:', payload);
    if (payload.data && payload.data.click_action) {
        window.location.href = payload.data.click_action;
    }
});
```

**After**:
```javascript
import { getMessaging, onMessage } from 'firebase/messaging';

// Background messages are handled by service worker (firebase-messaging-sw.js)
```

### Additional Fixes Made During Investigation
- Downgraded Vite from v7.2.7 → v6.3.5 (more stable)
- Reverted Tailwind CSS from v4 → v3.4.17 (with PostCSS configuration)
- Re-enabled VitePWA plugin in vite.config.js
- Fixed CSS syntax: removed spaces in arbitrary Tailwind value `rgba(0, 0, 0, 0.1)` → `rgba(0,0,0,0.1)`

### Files Modified
- `src/firebase/config.js` - Removed invalid import and handler
- `vite.config.js` - Re-enabled VitePWA, removed @tailwindcss/vite
- `postcss.config.js` - Recreated for Tailwind v3
- `src/index.css` - Reverted to @tailwind directives, fixed rgba syntax

### Verification
```
✓ npm run build completed successfully (3011 modules)
✓ firebase deploy --only hosting succeeded
✓ App live at https://atlas-011.web.app
```

### Prevention
- `onBackgroundMessage` should ONLY be used in service worker files
- For background messaging, use `public/firebase-messaging-sw.js`
- IDE may not catch this error - always run build before committing

---

## Issue #9: Manual Trigger Notifications Not Working
**Date**: 2025-12-13  
**Severity**: High  
**Status**: ✅ Resolved

### Problem
The "Send Reminder" button on the MD Dashboard was not working. Clicking it showed a network error, and push notifications were not being sent to employees.

### Symptoms
- Button would spin briefly then show error
- Console showed network error / failed fetch
- No notifications received by any users

### Root Cause
Frontend code was using **incorrect backend URLs**:

| File | Incorrect URL | Correct URL |
|------|---------------|-------------|
| `api.js` | `atlas-backend.onrender.com` | `atlas-backend-gncd.onrender.com` |
| `Dashboard.jsx` | `localhost:5000` | `atlas-backend-gncd.onrender.com` |

The `atlas-backend.onrender.com` URL doesn't exist - the actual deployed backend has a different subdomain (`-gncd`).

### Solution
Updated both files to use the correct Render backend URL:

**api.js**:
```javascript
// Before
const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend.onrender.com';

// After
const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com';
```

**Dashboard.jsx**:
```javascript
// Before
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// After
const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com';
```

### Verification
1. Tested backend endpoint directly:
   ```powershell
   Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" -Method POST
   # Response: success=True, method=BROADCAST, topic=atlas_all_users
   ```

2. Rebuilt and deployed frontend to Firebase Hosting

3. Committed to GitHub: `2b82e33`

### Files Modified
- `src/services/api.js` - Fixed default API URL
- `src/md/pages/Dashboard.jsx` - Fixed fallback API URL

### Prevention
- Always verify backend URLs match actual deployment
- Use environment variables for production URLs
- Document the actual Render subdomain in RENDER_FIX.md
- Test API endpoints before deploying frontend changes

---

## Issue #7: Firebase Deploy Failed
**Date**: 2025-12-12  
**Severity**: Low  
**Status**: ⚠️ Noted (User attempted, no details)

### Problem
User attempted `firebase deploy` which failed with exit code 1.

### Possible Causes
- Not logged into Firebase CLI
- No Firebase project selected
- Missing firebase.json configuration
- Build artifacts not present

### Recommended Solution
1. Check Firebase login: `firebase login`
2. Check active project: `firebase use`
3. Ensure build is complete: `npm run build`
4. Deploy with specific target: `firebase deploy --only hosting`

### Status
Not fully investigated - user may have resolved independently or used alternative deployment method.

---

## Summary Statistics

### Issues by Severity
- **Critical**: 2 (Firebase Auth, Build Failure)
- **High**: 4 (Render Backend, MD Redirect, Excel Export, Notifications)
- **Medium**: 1 (Profile Loading)
- **Low**: 2 (Excel Format, Firebase Deploy)

### Issues by Status
- **Resolved**: 8
- **Noted**: 1

### Issues by Category
- **Authentication**: 2 issues
- **Backend/API**: 3 issues
- **Build/Tooling**: 1 issue
- **User Experience**: 2 issues
- **Deployment**: 1 issue

### Most Complex Issue
**Firebase Authentication API Key** - Required understanding of PWA caching, service workers, build process, and environment variable injection.

### Quickest Resolution
**Excel Format Improvements** - Straightforward ExcelJS formatting enhancements.

---

## Lessons Learned

### 1. PWA Caching
- Service workers aggressively cache assets
- Always clear cache after config changes
- Test in incognito mode first
- Consider cache-busting strategies

### 2. Backend Deployment
- Always bind to `0.0.0.0` for cloud platforms
- Never use `process.exit()` in initialization
- Add comprehensive logging for debugging
- Graceful error handling is critical

### 3. Role-Based Access Control
- Allowlists should take absolute priority
- Database roles can become stale
- Auto-correction mechanisms are helpful
- Always verify role assignment in auth flow

### 4. Module Imports
- Be careful with CommonJS destructuring
- Verify what's actually exported
- Use consistent import patterns
- Test imports in isolation

### 5. Excel Generation
- ExcelJS provides excellent formatting control
- Bold fonts improve readability significantly
- Dynamic column widths based on content
- Color coding enhances user experience

---

## Prevention Strategies

### For Future Development

1. **Authentication Changes**
   - Always test in incognito mode
   - Document cache clearing steps
   - Add version numbers to config files
   - Implement cache-busting

2. **Backend Deployment**
   - Use health check endpoints
   - Implement startup logging
   - Test locally before deploying
   - Monitor Render logs actively

3. **Role Management**
   - Keep allowlist as source of truth
   - Auto-sync database roles
   - Log all role assignments
   - Regular role audits

4. **Code Quality**
   - Verify imports in new files
   - Test error paths
   - Add comprehensive logging
   - Use TypeScript for type safety

5. **Excel/Reports**
   - Test with real data
   - Verify formatting in Excel
   - Check column widths
   - Validate all edge cases

---

## Related Documentation

- `AUTH_FROZEN.md` - Frozen authentication system
- `backend/RENDER_FIX.md` - Render deployment guide
- `DEPLOYMENT_COMPLETE.md` - Full deployment documentation
- `deployment_walkthrough.md` - Step-by-step deployment

---

## Contact & Support

**Project**: ATLAS Attendance System  
**Last Updated**: 2025-12-12  
**Status**: Production Ready ✅

For issues or questions, refer to the documentation files listed above.

---

## Issue #10: Deployment 404 - Page Not Found
**Date**: 2025-12-17
**Severity**: High
**Status**: ✅ Resolved

### Problem
After deployment to `https://atlas-011.web.app/`, users encountered a "Page Not Found" (404) error instead of the application dashboard.
The standard Firebase Hosting 404 page was displayed.

### Root Cause
1.  **Missing fallback configuration**: `firebase.json` had rewrite rules, but if the browser cached a state where `index.html` was missing (from a partial deploy), it would persist the 404.
2.  **Browser Caching**: The browser aggressively cached the 404 response or the lack of `index.html`.
3.  **Deploy targets**: Initial deploy command `firebase deploy --only hosting,database` failed due to PowerShell parsing of the comma, potentially leaving the Hosting in an inconsistent state on the first attempt.
4.  **No `404.html`**: The application lacked a custom `404.html` to handle routing errors gracefully and redirect back to the app entry point.

### Solution
1.  **Created `public/404.html`**: A custom error page that strictly redirects `window.location.href = "/"` to force a reload of the app.
2.  **Updated `firebase.json` headers**: Added strict `Cache-Control: no-cache, no-store, must-revalidate` to specific headers to prevent browsers from holding onto stale deployment states.
3.  **Fixed Deploy Syntax**: Used quotes for multiple targets: `firebase deploy --only "hosting,database"`.

### Verification
- `npm run build` generates `dist/index.html` and `dist/404.html`.
- `firebase deploy` succeeded with 26 files.
- Verified `firebase.json` syntax (fixed extra trailing comma).
- User instruction: Hard Refresh (Ctrl+Shift+R) required to clear local cache.

### Files Modified
- `public/404.html` (New)
- `firebase.json` (Updated headers)

