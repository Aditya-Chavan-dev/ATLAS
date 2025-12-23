# 🔄 ATLAS API Key Rotation Guide

## ⚠️ CRITICAL: What to Rotate vs. What NOT to Rotate

### **DO NOT ROTATE (Breaking Change):**

#### ❌ **Firebase Web API Key**
- **Current Key:** `AIzaSy...` in `.env`
- **Why NOT rotate:** 
  - This is your **project identifier**, not a secret
  - Rotating it will **break your entire app**
  - All existing users will lose access
  - Firebase SDK will fail to initialize
- **Security:** Protected by Firebase Security Rules, not the key itself
- **Action:** ✅ **KEEP AS IS**

#### ❌ **Firebase Project ID**
- **Current:** `atlas-011`
- **Why NOT rotate:** This is your project identifier
- **Action:** ✅ **KEEP AS IS**

#### ❌ **VAPID Key (Push Notifications)**
- **Current:** `B...` in `.env`
- **Why NOT rotate:**
  - This is a **public key** (safe to expose)
  - Rotating will invalidate all existing FCM tokens
  - All users will need to re-grant notification permission
- **Action:** ✅ **KEEP AS IS** (unless compromised)

---

### **SHOULD ROTATE (Security Best Practice):**

#### ✅ **Firebase Service Account Key (Backend)**
- **Location:** Render environment variables
- **Why rotate:** 
  - This is an **actual secret** with admin privileges
  - Contains private key
  - Should be rotated periodically
- **Impact:** Backend needs redeployment
- **Action:** ✅ **ROTATE NOW**

#### ✅ **OAuth Client Secrets (If Any)**
- **Location:** Google Cloud Console
- **Why rotate:** Prevents unauthorized OAuth flows
- **Action:** ✅ **ROTATE IF USED**

---

## 🔧 Step-by-Step Rotation Guide

### **Option 1: Rotate Service Account Key (Recommended)**

This is the ONLY key that should be rotated for security.

#### **Step 1: Generate New Service Account Key**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `atlas-011`
3. Click ⚙️ **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. **IMPORTANT:** Keep this file secure, never commit to git

#### **Step 2: Update Render Environment Variables**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Find `FIREBASE_SERVICE_ACCOUNT`
5. Click **Edit**
6. Paste the **entire contents** of the new JSON file
7. Click **Save Changes**

#### **Step 3: Delete Old Service Account Key**

1. Go back to Firebase Console → Service Accounts
2. Find the old key in the list
3. Click **Delete** (trash icon)
4. Confirm deletion

#### **Step 4: Redeploy Backend**

Render will automatically redeploy when you save environment variables.

**Verify:**
```bash
# Check backend logs on Render
# Should see: "✅ Firebase Admin SDK initialized successfully"
```

---

### **Option 2: Add Domain Restrictions (Extra Security)**

This doesn't rotate keys but adds an extra layer of security.

#### **Step 1: Restrict Firebase API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `atlas-011`
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key (starts with `AIzaSy...`)
5. Click **Edit**
6. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     ```
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     http://localhost:5173/*  (for development)
     ```
7. Click **Save**

**Note:** This doesn't change the key, just restricts where it can be used from.

---

### **Option 3: Enable Firebase App Check (Advanced)**

Adds bot protection and abuse prevention.

#### **Step 1: Enable App Check**

1. Go to Firebase Console
2. Navigate to **App Check**
3. Click **Get Started**
4. Select your web app
5. Choose provider: **reCAPTCHA v3** or **reCAPTCHA Enterprise**
6. Register your site
7. Get site key

#### **Step 2: Add to Frontend**

```javascript
// src/firebase/config.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// Initialize App Check
if (import.meta.env.PROD) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

---

## 📋 Rotation Checklist

### **Before Rotation:**
- [ ] Backup current service account key (store securely offline)
- [ ] Note current backend deployment status
- [ ] Inform team about potential downtime
- [ ] Have rollback plan ready

### **During Rotation:**
- [ ] Generate new service account key in Firebase
- [ ] Update Render environment variables
- [ ] Wait for automatic redeployment
- [ ] Verify backend logs show successful initialization
- [ ] Test backend API endpoints

### **After Rotation:**
- [ ] Delete old service account key from Firebase
- [ ] Verify app functionality (login, data access, notifications)
- [ ] Monitor Firebase usage for anomalies
- [ ] Update documentation with rotation date
- [ ] Securely destroy old key backup after 7 days

---

## 🧪 Testing After Rotation

### **1. Test Backend Connection:**
```bash
# Check if backend can connect to Firebase
curl https://your-backend.onrender.com/health

# Expected: 200 OK
```

### **2. Test Authentication:**
```bash
# Try logging in to the app
# Should work normally
```

### **3. Test Database Access:**
```bash
# Check if backend can read/write data
# Login as MD, view dashboard
# Should see employee data
```

### **4. Test Notifications:**
```bash
# Send a test notification from MD dashboard
# Should deliver successfully
```

---

## ⚠️ What NOT to Do

### **DON'T:**
❌ Rotate Firebase Web API Key (will break app)
❌ Change Firebase Project ID (will break everything)
❌ Rotate VAPID key unless absolutely necessary
❌ Delete service account before updating Render
❌ Commit new service account key to git
❌ Share service account key in Slack/email
❌ Use same service account key for multiple projects

### **DO:**
✅ Only rotate service account key (backend)
✅ Keep web API key as is (it's safe)
✅ Add domain restrictions for extra security
✅ Enable App Check for bot protection
✅ Monitor Firebase usage after rotation
✅ Document rotation in security log
✅ Test thoroughly after rotation

---

## 🔒 Security Best Practices

### **1. Regular Rotation Schedule:**
```
Service Account Key: Every 90 days
OAuth Secrets: Every 180 days
Web API Key: Never (unless compromised)
VAPID Key: Never (unless compromised)
```

### **2. Access Control:**
```
Firebase Console: Only authorized team members
Render Dashboard: Only DevOps team
Service Account Keys: Encrypted storage only
Environment Variables: Never in code
```

### **3. Monitoring:**
```
Firebase Usage: Daily review
Render Logs: Monitor for errors
Failed Auth Attempts: Alert on spikes
API Quotas: Track usage patterns
```

---

## 📊 Current Key Status

### **Keys in ATLAS:**

| Key Type | Location | Status | Action Needed |
|----------|----------|--------|---------------|
| Firebase Web API Key | `.env` (gitignored) | ✅ Safe | None - Keep as is |
| Firebase Project ID | `.env` (gitignored) | ✅ Safe | None - Keep as is |
| VAPID Key | `.env` (gitignored) | ✅ Safe | None - Keep as is |
| Service Account Key | Render env vars | ⚠️ Unknown age | ✅ Rotate now |
| Database URL | `.env` (gitignored) | ✅ Safe | None - Keep as is |

---

## 🎯 Recommended Action Plan

### **Immediate (Do Now):**
1. ✅ Rotate Firebase Service Account Key
2. ✅ Add domain restrictions to Firebase API key
3. ✅ Verify all services work after rotation

### **Short-term (This Week):**
1. ✅ Enable Firebase App Check
2. ✅ Set up monitoring for Firebase usage
3. ✅ Document rotation in security log

### **Long-term (Ongoing):**
1. ✅ Schedule quarterly service account rotation
2. ✅ Review Firebase Security Rules monthly
3. ✅ Monitor for suspicious activity
4. ✅ Keep dependencies updated

---

## 📞 Emergency Procedures

### **If Service Account Key is Compromised:**

1. **Immediately:**
   - Generate new service account key
   - Update Render environment variables
   - Delete compromised key from Firebase
   - Force redeploy backend

2. **Within 1 Hour:**
   - Review Firebase audit logs
   - Check for unauthorized access
   - Monitor database for changes
   - Alert team

3. **Within 24 Hours:**
   - Investigate how compromise occurred
   - Update security procedures
   - Document incident
   - Review all access logs

### **If Web API Key is Exposed (Not a Problem):**

1. **Don't Panic** - This is expected and safe
2. **Verify** Firebase Security Rules are strong
3. **Optionally** add domain restrictions
4. **Monitor** for unusual usage patterns

---

## ✅ Summary

**For ATLAS, you should:**

1. ✅ **Rotate Service Account Key** (backend admin credentials)
2. ✅ **Add Domain Restrictions** (extra security layer)
3. ❌ **DO NOT rotate Web API Key** (will break app)
4. ❌ **DO NOT rotate VAPID Key** (will invalidate all push tokens)

**The web API key is NOT a security risk** - it's designed to be public and is protected by Firebase Security Rules.

---

**Ready to proceed? I can help you with:**
1. Generating new service account key
2. Updating Render environment variables
3. Testing after rotation
4. Adding domain restrictions

Let me know which you'd like to do!
