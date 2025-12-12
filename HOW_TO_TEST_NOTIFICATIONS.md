# 🔔 Push Notifications Testing Guide

## Overview

Your ATLAS app has push notifications scheduled for:
- **10:00 AM IST** (Mon-Sat) - Morning reminder
- **05:00 PM IST** (Mon-Sat) - Afternoon reminder

This guide will help you test if they're working.

---

## 🧪 Testing Methods

### Method 1: Manual API Trigger (Recommended)

Test notifications immediately without waiting for scheduled time.

#### Step 1: Ensure Backend is Running

1. Check backend status: https://atlas-backend-gncd.onrender.com/api
2. Should return:
   ```json
   {
     "status": "active",
     "service": "ATLAS Notification Server",
     "timestamp": "...",
     "version": "2.0.0 (Refactored)"
   }
   ```

#### Step 2: Get Your FCM Token

**Option A: From Browser Console**

1. Open your app: https://atlas-011.web.app
2. Login with your account
3. Open DevTools (F12)
4. Go to **Console** tab
5. Look for: `FCM Token: <your-token>`
6. Copy the token (long string starting with `e` or `f`)

**Option B: From Firebase Realtime Database**

1. Go to: https://console.firebase.google.com/project/atlas-011/database
2. Navigate to: `users/<your-uid>/fcmToken`
3. Copy the token value

#### Step 3: Test with cURL (PowerShell)

```powershell
# Replace <YOUR_FCM_TOKEN> with actual token from Step 2
$token = "<YOUR_FCM_TOKEN>"

# Test notification
Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{token=$token} | ConvertTo-Json)
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Test notification sent",
  "result": { ... }
}
```

#### Step 4: Check Your Device

- **Desktop**: Notification should appear in system tray
- **Mobile**: Notification should appear in notification center
- **Browser**: Check if notification permission is granted

---

### Method 2: Wait for Scheduled Time

Test the automatic cron job execution.

#### Scheduled Times (IST)

- **Morning**: 10:00 AM (Mon-Sat)
- **Afternoon**: 5:00 PM (Mon-Sat)

#### What to Expect

**At 10:00 AM IST**:
- All employees who haven't marked attendance receive notification
- Message: "Good morning! Please mark your attendance for today."

**At 5:00 PM IST**:
- Employees who marked morning but not evening receive notification
- Message: "Don't forget to mark your evening attendance!"

#### How to Verify

1. **Before scheduled time**: Ensure you haven't marked attendance
2. **At scheduled time**: Wait for notification
3. **Check backend logs**: 
   - Go to: https://dashboard.render.com
   - Select your backend service
   - Check logs for: `⏰ Running morning reminder...` or `⏰ Running afternoon reminder...`

---

### Method 3: Test from Frontend UI

Use the app's built-in notification request.

#### Step 1: Enable Notifications

1. Open: https://atlas-011.web.app
2. Login to your account
3. Browser will ask: **"Allow notifications?"**
4. Click **"Allow"**

#### Step 2: Verify FCM Token Saved

1. Open DevTools (F12) → Console
2. Look for: `✅ FCM token saved to database`
3. Or check: `FCM Token: <token>`

#### Step 3: Trigger from App

Currently, notifications are triggered automatically. To test manually:

1. Mark attendance in the morning
2. Wait until 5 PM
3. Should receive reminder to mark evening attendance

---

## 🔍 Troubleshooting

### Issue: No Notification Received

#### Check 1: Browser Permissions

1. Click the **lock icon** in address bar
2. Check **Notifications** permission
3. Should be: **"Allow"**
4. If blocked, change to Allow and refresh

#### Check 2: FCM Token Exists

```powershell
# Check if token is in database
# Go to Firebase Console → Realtime Database
# Navigate to: users/<your-uid>/fcmToken
# Should have a value
```

#### Check 3: Backend Logs

1. Go to: https://dashboard.render.com
2. Select: **atlas-backend**
3. Click: **Logs**
4. Look for errors or successful sends

#### Check 4: Service Worker Active

1. Open DevTools (F12)
2. Go to: **Application** tab
3. Click: **Service Workers**
4. Should show: **firebase-messaging-sw.js** (activated and running)

---

### Issue: "Permission Denied" Error

**Solution**:
1. Browser settings → Site settings
2. Find: https://atlas-011.web.app
3. Notifications: Change to **"Allow"**
4. Refresh the page
5. Try again

---

### Issue: Backend Not Responding

**Solution**:
1. Backend might be sleeping (Render free tier)
2. Visit: https://atlas-backend-gncd.onrender.com/api
3. Wait 30 seconds for wake-up
4. Try notification test again

---

## 📊 Verification Checklist

### Before Testing

- [ ] Backend is running (check /api endpoint)
- [ ] Logged into the app
- [ ] Browser notification permission granted
- [ ] FCM token visible in console or database
- [ ] Service worker is active

### During Testing

- [ ] API call returns success
- [ ] Backend logs show notification sent
- [ ] Notification appears on device
- [ ] Notification has correct message
- [ ] Clicking notification opens app

### After Testing

- [ ] Notification received successfully
- [ ] No errors in console
- [ ] Backend logs show success
- [ ] Token is valid and saved

---

## 🧪 Advanced Testing

### Test All Notification Types

#### 1. Morning Reminder (10 AM)

```powershell
# Simulate morning reminder
Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"type":"morning"}'
```

#### 2. Afternoon Reminder (5 PM)

```powershell
# Simulate afternoon reminder
Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"type":"afternoon"}'
```

#### 3. Leave Approval Notification

This is triggered automatically when MD approves/rejects leave.

**To test**:
1. Apply for leave as employee
2. Login as MD
3. Approve or reject the leave
4. Employee should receive notification

---

## 📱 Platform-Specific Notes

### Windows Desktop

- Notifications appear in **Action Center** (bottom right)
- Click notification to open app
- May need to enable notifications in Windows Settings

### macOS Desktop

- Notifications appear in **Notification Center** (top right)
- Click notification to open app
- Check System Preferences → Notifications → Chrome/Firefox

### Android Mobile

- Notifications appear in notification drawer
- Swipe down to see
- Tap to open app
- Check app notification settings

### iOS Mobile (Safari)

- iOS Safari has limited PWA notification support
- May need to use Chrome or Firefox
- Or wait for iOS 16.4+ for better support

---

## 🔧 Backend Notification Endpoints

### Available Endpoints

#### 1. Health Check
```
GET https://atlas-backend-gncd.onrender.com/api
```

#### 2. Trigger Test Notification
```
POST https://atlas-backend-gncd.onrender.com/api/trigger-reminder
Body: { "token": "your-fcm-token" }
```

#### 3. Morning Reminder (Cron Job)
```
Automatic at 10:00 AM IST (Mon-Sat)
UTC: 04:30 AM
```

#### 4. Afternoon Reminder (Cron Job)
```
Automatic at 05:00 PM IST (Mon-Sat)
UTC: 11:30 AM
```

---

## 📝 Sample Test Script

Save this as `test-notifications.ps1`:

```powershell
# ATLAS Push Notification Test Script

Write-Host "🔔 ATLAS Push Notification Tester" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray
Write-Host ""

# Step 1: Check backend
Write-Host "1. Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api"
    Write-Host "✅ Backend is running: $($health.service)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not responding!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Get FCM token
Write-Host "2. Enter your FCM token:" -ForegroundColor Yellow
Write-Host "   (Get from browser console or Firebase Database)" -ForegroundColor Gray
$token = Read-Host "   FCM Token"

if (!$token) {
    Write-Host "❌ No token provided!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Send test notification
Write-Host "3. Sending test notification..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body (@{token=$token} | ConvertTo-Json)
    
    Write-Host "✅ Notification sent successfully!" -ForegroundColor Green
    Write-Host "   Check your device for the notification." -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to send notification!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Gray
Write-Host "✅ Test Complete!" -ForegroundColor Green
```

**Run it**:
```powershell
.\test-notifications.ps1
```

---

## 🎯 Quick Test (30 seconds)

1. **Open app**: https://atlas-011.web.app
2. **Login** and allow notifications
3. **Open DevTools** (F12) → Console
4. **Copy FCM token** from console
5. **Run this command**:
   ```powershell
   Invoke-RestMethod -Uri "https://atlas-backend-gncd.onrender.com/api/trigger-reminder" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"token":"<YOUR_TOKEN>"}'
   ```
6. **Check notification** on your device

---

## 📞 Support

### If Notifications Don't Work

1. **Check backend logs**: https://dashboard.render.com
2. **Verify FCM setup**: Firebase Console → Cloud Messaging
3. **Check service worker**: DevTools → Application → Service Workers
4. **Test browser**: Try different browser (Chrome recommended)

### Common Issues

- **Backend sleeping**: Wait 30 seconds, try again
- **Permission denied**: Check browser notification settings
- **Token expired**: Logout and login again to refresh token
- **Service worker not active**: Hard refresh (Ctrl+Shift+R)

---

**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Success Rate**: High (if backend is running)

🔔 **Ready to test? Follow Method 1 for immediate results!**
