# Push Notification Testing Guide
**Date:** 2025-12-23  
**Status:** Ready for Testing

## 🎯 Overview
This guide will help you verify that push notifications are working correctly in your ATLAS application after setting up the VAPID key.

---

## ✅ Prerequisites Checklist

### Backend Setup
- [x] VAPID key added to `.env` file as `VITE_FIREBASE_VAPID_KEY`
- [x] Backend has Firebase Admin SDK configured
- [x] Backend notification controller implemented
- [x] Backend is running (check Render dashboard)

### Frontend Setup
- [x] FCM service (`src/services/fcm.js`) configured
- [x] Service worker (`public/firebase-messaging-sw.js`) created
- [x] VAPID key environment variable configured

---

## 🧪 Test Plan

### Phase 1: Environment Verification

#### 1.1 Check VAPID Key Configuration
```bash
# In your project root
cat .env | findstr VITE_FIREBASE_VAPID_KEY
```
**Expected:** Should show your VAPID key (starts with "B...")

#### 1.2 Verify Service Worker File
```bash
# Check if service worker exists
ls public/firebase-messaging-sw.js
```
**Expected:** File should exist

#### 1.3 Build the Application
```bash
npm run build
```
**Expected:** Build should complete without errors

---

### Phase 2: Local Testing

#### 2.1 Start Development Server
```bash
npm run dev
```
**Expected:** Server starts on `http://localhost:5173`

#### 2.2 Open Browser DevTools
1. Open Chrome/Edge browser
2. Navigate to `http://localhost:5173`
3. Open DevTools (F12)
4. Go to **Console** tab

#### 2.3 Check Service Worker Registration
1. In DevTools, go to **Application** tab
2. Click **Service Workers** in left sidebar
3. Look for `firebase-messaging-sw.js`

**Expected:** Service worker should be registered and running

#### 2.4 Test Notification Permission
1. Login to the application
2. Watch the browser's address bar for notification permission prompt
3. Click **Allow** when prompted

**Expected Console Logs:**
```
[FCM] Token Registered: <long-token-string>
```

#### 2.5 Verify Token in Database
1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to **Realtime Database**
3. Look for `/deviceTokens/` node
4. Find your token entry

**Expected Structure:**
```json
{
  "deviceTokens": {
    "<your-token>": {
      "uid": "<user-id>",
      "email": "<user-email>",
      "platform": "web",
      "notificationsEnabled": true,
      "createdAt": "2025-12-23T...",
      "lastSeen": "2025-12-23T..."
    }
  }
}
```

---

### Phase 3: Notification Delivery Test

#### 3.1 Test from MD Dashboard
1. Login as MD (Managing Director)
2. Navigate to Dashboard
3. Click **Send Reminder** button (FAB in bottom-right)
4. Confirm the action

**Expected:**
- Success message appears
- Statistics show "Sent to: 1" (or number of registered devices)

#### 3.2 Verify Notification Received

**Foreground Test (App is Open):**
1. Keep the app open in browser
2. Trigger broadcast from MD dashboard
3. Watch for notification popup

**Expected:**
- Browser notification appears with:
  - Title: "Attendance Reminder"
  - Body: "Mark your attendance for today"
  - Icon: ATLAS logo

**Background Test (App is Closed/Minimized):**
1. Minimize or close the browser tab
2. Trigger broadcast from MD dashboard
3. Check system notification tray

**Expected:**
- System notification appears
- Clicking notification opens the app

---

### Phase 4: Advanced Testing

#### 4.1 Test Multiple Devices
1. Open app in different browsers (Chrome, Edge, Firefox)
2. Login with different employee accounts
3. Grant notification permission on each
4. Send broadcast from MD dashboard

**Expected:**
- All devices receive notification
- Statistics show correct count

#### 4.2 Test Permission Denied Scenario
1. Open app in incognito/private window
2. Login
3. Click **Block** on notification permission
4. Check backend response

**Expected:**
- No token created in database
- App continues to work normally
- Statistics show "Permission Denied: 1"

#### 4.3 Test Token Cleanup
1. Revoke notification permission in browser settings
2. Send broadcast from MD dashboard
3. Check Firebase Database

**Expected:**
- Invalid token removed from `/deviceTokens/`
- Statistics show failure count

---

## 🔍 Debugging Guide

### Issue: No Notification Permission Prompt

**Possible Causes:**
1. Permission already granted/denied
2. Not using HTTPS (required for notifications)
3. Service worker not registered

**Solutions:**
```bash
# Check browser notification settings
chrome://settings/content/notifications

# Reset site permissions
# DevTools > Application > Storage > Clear site data
```

### Issue: Token Not Registered

**Check Console for Errors:**
```javascript
// Look for these errors:
- "Messaging: We are unable to register the default service worker"
- "Messaging: A problem occurred while subscribing the user to FCM"
- "Failed to register a ServiceWorker"
```

**Solutions:**
1. Verify VAPID key is correct
2. Check service worker file exists
3. Ensure backend API is accessible

### Issue: Notification Not Received

**Debugging Steps:**
1. Check browser console for FCM errors
2. Verify token exists in Firebase Database
3. Check backend logs on Render
4. Verify `notificationsEnabled` is `true`

**Backend Logs to Check:**
```
📢 Starting Broadcast (Token-Based - Global)...
[Broadcast] Found X targets out of Y tokens.
```

### Issue: Service Worker Not Loading

**Check Network Tab:**
1. DevTools > Network
2. Filter: `firebase-messaging-sw.js`
3. Check status code (should be 200)

**Common Errors:**
- 404: File not in `public` folder
- CORS: Incorrect headers
- Syntax Error: Check service worker code

---

## 📊 Success Criteria

✅ **All tests pass if:**
1. Notification permission prompt appears on login
2. Token is registered in Firebase Database
3. Foreground notifications appear when app is open
4. Background notifications appear when app is closed
5. MD dashboard shows accurate delivery statistics
6. Invalid tokens are automatically cleaned up
7. No console errors related to FCM

---

## 🚀 Next Steps After Testing

### If Tests Pass:
1. Deploy to production (Render)
2. Test on production URL
3. Monitor Firebase Database for token growth
4. Track notification delivery rates

### If Tests Fail:
1. Review error messages in console
2. Check backend logs on Render
3. Verify all environment variables
4. Ensure VAPID key matches between frontend and Firebase Console

---

## 📝 Quick Test Commands

```bash
# 1. Build the app
npm run build

# 2. Start dev server
npm run dev

# 3. Check environment variables
cat .env | findstr VITE_FIREBASE_VAPID_KEY

# 4. Deploy to production (if tests pass)
git add .
git commit -m "feat: add push notification support"
git push origin main
```

---

## 🔗 Useful Links

- **Firebase Console:** https://console.firebase.google.com
- **Render Dashboard:** https://dashboard.render.com
- **FCM Documentation:** https://firebase.google.com/docs/cloud-messaging
- **Service Worker Debugging:** chrome://serviceworker-internals

---

## 📞 Support

If you encounter issues:
1. Check the **Debugging Guide** section above
2. Review browser console for specific errors
3. Check backend logs on Render
4. Verify Firebase Database structure

---

**Last Updated:** 2025-12-23  
**Version:** 1.0
