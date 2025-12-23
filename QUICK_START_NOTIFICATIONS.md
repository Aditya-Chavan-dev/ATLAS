# 🎯 QUICK START - Push Notification Testing

## ⚡ 3-Minute Test

### Option 1: Standalone Test Page (Recommended for Quick Check)

1. **Update VAPID Key in Test Page:**
   ```bash
   # Open: public/test-notifications.html
   # Find line: const VAPID_KEY = "YOUR_VAPID_KEY_HERE";
   # Replace with your actual VAPID key from .env
   ```

2. **Open Test Page:**
   ```
   http://localhost:5173/test-notifications.html
   ```

3. **Click Buttons:**
   - "Request Notification Permission" → Click "Allow"
   - "Send Test Notification" → Verify notification appears

---

### Option 2: Full Application Test

1. **Open App:**
   ```
   http://localhost:5173
   ```

2. **Login as Employee:**
   - Grant notification permission when prompted
   - Check console for: `[FCM] Token Registered`

3. **Login as MD:**
   - Go to Dashboard
   - Click "Send Reminder" (FAB button bottom-right)
   - Verify notification received

---

## 🔍 Quick Checks

### ✅ Success Indicators
- [ ] Browser shows permission prompt
- [ ] Console shows: `[FCM] Token Registered: ...`
- [ ] Firebase Database has entry in `/deviceTokens/`
- [ ] Notification appears (foreground or background)
- [ ] MD Dashboard shows delivery statistics

### ❌ Common Issues

**No permission prompt?**
→ Clear site data: DevTools > Application > Storage > Clear site data

**Token not generated?**
→ Check VAPID key in `.env` matches Firebase Console

**Notification not received?**
→ Check backend logs on Render, verify token in Firebase Database

---

## 📊 Where to Look

### Browser Console
```
[FCM] Token Registered: eyJhbGc...
Firebase Config: { apiKey: '✓ Set', ... }
```

### Firebase Database
```
/deviceTokens/
  └── <token>/
      ├── uid: "user123"
      ├── email: "user@example.com"
      ├── notificationsEnabled: true
```

### MD Dashboard
```
Notifications Sent
├── Sent To: 4
├── Successfully Sent: 4
└── Failed: 0
```

---

## 🚀 Server Status

**Dev Server:** ✅ Running on `http://localhost:5173`

**To stop:** Press `Ctrl+C` in terminal

**To restart:** `npm run dev`

---

## 📚 Full Documentation

- **Detailed Guide:** `PUSH_NOTIFICATION_TEST.md`
- **Summary:** `NOTIFICATION_TESTING_SUMMARY.md`
- **Pre-flight Check:** `node check-notifications.js`

---

**Start testing now! Good luck! 🎉**
