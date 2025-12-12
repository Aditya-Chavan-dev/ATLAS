# 🔒 FROZEN AUTHENTICATION SYSTEM - DO NOT MODIFY

## ⚠️ CRITICAL WARNING ⚠️

The following files contain **FROZEN** authentication logic that has been verified to work correctly as of **2025-12-12**. 

**DO NOT MODIFY** these files unless absolutely necessary. Any changes may break the entire authentication system.

---

## Protected Files

### 1. Firebase Configuration
**File**: `src/firebase/config.js`
- **Purpose**: Initializes Firebase app and services
- **Contains**: API keys, auth domain, database URL, project ID
- **Critical**: Environment variable loading, Firebase SDK initialization
- **Last Verified**: 2025-12-12

### 2. Authentication Context
**File**: `src/context/AuthContext.jsx`
- **Purpose**: Manages authentication state and user sessions
- **Contains**: 
  - Google Sign-In flow
  - User role assignment (MD vs Employee)
  - User profile migration logic
  - Auth persistence (LOCAL storage)
  - Realtime database listeners
- **Critical**: Any changes will affect all authenticated users
- **Last Verified**: 2025-12-12

### 3. Login Page
**File**: `src/pages/Login.jsx`
- **Purpose**: Login UI and Google Sign-In button
- **Contains**: 
  - Google authentication trigger
  - PWA install prompts
  - Role-based navigation
- **Critical**: Entry point for all users
- **Last Verified**: 2025-12-12

### 4. Role Configuration
**File**: `src/config/roleConfig.js`
- **Purpose**: Defines user roles and routing
- **Contains**:
  - ROLES constants (MD, EMPLOYEE)
  - Route mapping for each role
- **Critical**: Changes will affect access control
- **Last Verified**: 2025-12-12

### 5. Build Script
**File**: `scripts/generate-sw-config.cjs`
- **Purpose**: Generates Firebase config from environment variables
- **Contains**:
  - Environment variable loading
  - Config file generation for service worker
- **Critical**: Runs during build and dev, affects all deployments
- **Last Verified**: 2025-12-12

### 6. Service Worker
**File**: `public/firebase-messaging-sw.js`
- **Purpose**: Handles push notifications and offline functionality
- **Contains**:
  - Firebase config loading
  - Push notification handlers
- **Critical**: Affects PWA functionality
- **Last Verified**: 2025-12-12

---

## What is Frozen?

The following authentication logic is **FROZEN**:

✅ **Google Sign-In Flow**
- OAuth popup configuration
- Account selection prompt
- Token handling

✅ **Role Assignment**
- MD allowlist checking
- Employee database lookup
- Role-based routing

✅ **User Migration**
- Placeholder UID to real UID migration
- Email-based user lookup
- Profile data preservation

✅ **Auth Persistence**
- LOCAL storage (persists indefinitely)
- Session management
- Auto-login on page refresh

✅ **Firebase Configuration**
- API key loading from environment variables
- Service initialization
- Database connection

---

## If You MUST Make Changes

### Before Making Changes:

1. **Document Current State**
   - Take screenshots of working authentication
   - Export current Firebase config
   - Backup all auth-related files

2. **Test Locally First**
   - Never deploy auth changes directly to production
   - Test in incognito mode
   - Test with multiple user accounts (MD and Employee)

3. **Have a Rollback Plan**
   - Keep backup of working files
   - Know how to revert changes quickly
   - Have the deployment walkthrough ready

### After Making Changes:

1. **Clear All Caches**
   - Browser cache
   - Service worker cache
   - PWA cache
   - Firebase auth cache

2. **Test Thoroughly**
   - Test Google Sign-In
   - Test MD login
   - Test Employee login
   - Test role-based routing
   - Test auth persistence
   - Test on multiple browsers
   - Test on mobile devices

3. **Monitor Production**
   - Check Firebase console for auth errors
   - Monitor user login success rates
   - Watch for error reports

---

## Known Working Configuration

### Environment Variables (`.env`)

**⚠️ SECURITY NOTE**: Never commit actual values to git. Use `.env.example` for templates.

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://<your-project>-default-rtdb.<region>.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>

# Backend API
VITE_API_URL=https://your-backend-url.onrender.com
```

**How to get these values**:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Click on your web app
6. Copy the configuration values


### Firebase Project
- **Project ID**: atlas-011
- **Auth Method**: Google Sign-In (OAuth)
- **Database**: Realtime Database (asia-southeast1)
- **Hosting**: Firebase Hosting (atlas-011.web.app)

### User Roles
- **MD**: Defined in `src/md/config/mdAllowList.js`
- **Employee**: All other authenticated users in database

---

## Deployment Process

When deploying changes that affect authentication:

1. **Build with correct environment variables**
   ```bash
   npm run build
   ```

2. **Verify generated config**
   ```bash
   Get-Content public\config\firebase-config.json
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

4. **Clear browser cache**
   - DevTools → Application → Clear storage
   - Hard refresh (Ctrl+Shift+R)
   - Test in incognito mode

---

## Troubleshooting

### Issue: "API key not valid" error

**Cause**: Old API key cached in browser or service worker

**Solution**:
1. Clear browser cache completely
2. Unregister all service workers
3. Hard refresh or use incognito mode
4. Verify `public/config/firebase-config.json` has correct key

### Issue: Users can't log in

**Cause**: Firebase configuration mismatch

**Solution**:
1. Check Firebase Console → Authentication → Sign-in method
2. Verify Google Sign-In is enabled
3. Check authorized domains include your hosting domain
4. Verify environment variables are correct

### Issue: Role assignment not working

**Cause**: Database structure or MD allowlist mismatch

**Solution**:
1. Check `src/md/config/mdAllowList.js` for MD emails
2. Verify user exists in Firebase Realtime Database
3. Check user role in database: `users/{uid}/role`

---

## Emergency Rollback

If authentication breaks in production:

1. **Revert to last working commit**
   ```bash
   git log --oneline  # Find last working commit
   git checkout <commit-hash> -- src/firebase/config.js
   git checkout <commit-hash> -- src/context/AuthContext.jsx
   ```

2. **Rebuild and redeploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. **Notify users to clear cache**

---

## Contact Information

**Last Modified**: 2025-12-12  
**Verified By**: Automated deployment system  
**Status**: ✅ WORKING IN PRODUCTION

**Production URLs**:
- Frontend: https://atlas-011.web.app
- Backend: https://atlas-backend-gncd.onrender.com

---

## Summary

🔒 **Authentication system is FROZEN**  
⚠️ **Do not modify without careful consideration**  
✅ **Current system is verified working**  
📋 **Follow this document if changes are necessary**  
🚨 **Have rollback plan ready before making changes**

**Remember**: Authentication is the foundation of the entire application. Breaking it affects ALL users.
