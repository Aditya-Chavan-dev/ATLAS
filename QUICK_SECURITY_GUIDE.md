# 🔐 Quick Security Enhancement Guide

## ✅ Safe Security Improvements (No Breaking Changes)

### **Option 1: Add Domain Restrictions (Recommended)**

This adds security WITHOUT rotating keys or breaking your app.

#### **Steps:**

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com
   - Select project: `atlas-011`

2. **Navigate to API Credentials:**
   - Click hamburger menu (☰)
   - Go to: **APIs & Services** → **Credentials**

3. **Find Your API Key:**
   - Look for key starting with `AIzaSy...`
   - Click the pencil icon (Edit)

4. **Add Application Restrictions:**
   - Under "Application restrictions"
   - Select: **HTTP referrers (web sites)**
   - Click **+ ADD AN ITEM**
   - Add these domains:
     ```
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     http://localhost:5173/*
     http://localhost:*/*
     ```
   - Click **Save**

**Result:** Your API key will only work from your domains. Attackers can't use it from other sites.

---

### **Option 2: Enable Firebase App Check (Advanced)**

Adds bot protection and abuse prevention.

#### **Steps:**

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com
   - Select project: `atlas-011`

2. **Enable App Check:**
   - Click **App Check** in left sidebar
   - Click **Get Started**
   - Select your web app
   - Choose: **reCAPTCHA v3**
   - Follow setup wizard

3. **Get reCAPTCHA Site Key:**
   - Copy the site key provided

4. **Add to Your App:**
   ```bash
   # Install App Check
   npm install firebase/app-check
   ```

5. **Update Code:**
   ```javascript
   // src/firebase/config.js
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

   const app = initializeApp(firebaseConfig);

   // Add this after Firebase initialization
   if (import.meta.env.PROD) {
     initializeAppCheck(app, {
       provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
       isTokenAutoRefreshEnabled: true
     });
   }
   ```

6. **Rebuild and Deploy:**
   ```bash
   npm run build
   git add .
   git commit -m "feat: add Firebase App Check for bot protection"
   git push origin main
   ```

---

### **Option 3: Rotate Service Account Key (Backend Only)**

This is the ONLY key that should be rotated.

#### **Quick Steps:**

1. **Firebase Console:**
   - Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file

2. **Render Dashboard:**
   - Go to your backend service
   - Environment tab
   - Edit `FIREBASE_SERVICE_ACCOUNT`
   - Paste entire JSON content
   - Save (auto-redeploys)

3. **Delete Old Key:**
   - Back to Firebase Console
   - Delete the old key

4. **Verify:**
   - Check Render logs
   - Should see: "✅ Firebase Admin SDK initialized successfully"

---

## ⚠️ What NOT to Do

**DO NOT:**
- ❌ Change the Firebase Web API Key in `.env`
- ❌ Rotate the VAPID key
- ❌ Change the Project ID
- ❌ Delete all service account keys at once

**These will BREAK your app!**

---

## 🎯 Recommended Approach

**For maximum security without breaking changes:**

1. ✅ **Add domain restrictions** (5 minutes, no code changes)
2. ✅ **Rotate service account key** (10 minutes, backend only)
3. ✅ **Enable App Check** (optional, 30 minutes, requires code update)

**Start with #1 - it's the safest and easiest!**

---

## 📞 Need Help?

**I can help you with:**
1. Adding domain restrictions (safest option)
2. Rotating service account key (backend only)
3. Enabling Firebase App Check (advanced)

**Which would you like to do first?**
