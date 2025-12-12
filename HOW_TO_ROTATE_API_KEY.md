# 🔄 Firebase API Key Rotation Guide

## Step-by-Step Instructions

### Option 1: Regenerate Existing Web API Key (Recommended)

This is the simplest method - it updates your existing key.

#### Step 1: Access Firebase Console

1. Open your browser
2. Go to: https://console.firebase.google.com
3. Click on your project: **atlas-011**

#### Step 2: Navigate to Project Settings

1. Click the **gear icon** (⚙️) in the top left
2. Select **Project settings**
3. Scroll down to the **"Your apps"** section
4. Find your **Web app** (should show your app name)

#### Step 3: Regenerate API Key

**Method A: Through Google Cloud Console** (Most Direct)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: **atlas-011**
3. Find the API key named **"Browser key (auto created by Firebase)"**
4. Click on the key name to edit
5. Click **"Regenerate Key"** button
6. Confirm the regeneration
7. **Copy the new API key** (starts with `AIzaSy...`)

**Method B: Through Firebase Console**

1. In Firebase Console → Project Settings
2. Under "Web API Key" you'll see your current key
3. Click **"Regenerate"** or **"Show key"**
4. If there's no regenerate button, use Method A above

#### Step 4: Update Your Local .env File

1. Open your project folder: `G:\ATLAS`
2. Open the `.env` file (create if doesn't exist)
3. Update the API key:

```env
VITE_FIREBASE_API_KEY=<paste-new-key-here>
```

**Complete .env file should look like**:
```env
VITE_FIREBASE_API_KEY=AIzaSy...your-new-key...
VITE_FIREBASE_AUTH_DOMAIN=atlas-011.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=atlas-011
VITE_FIREBASE_STORAGE_BUCKET=atlas-011.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=770708381517
VITE_FIREBASE_APP_ID=1:770708381517:web:84faf71d62f741494f6104
VITE_API_URL=https://atlas-backend-gncd.onrender.com
```

#### Step 5: Test Locally

```bash
# Navigate to project
cd G:\ATLAS

# Clean old build
Remove-Item -Recurse -Force dist
Remove-Item -Force public\config\firebase-config.json

# Rebuild with new key
npm run build

# Start dev server
npm run dev
```

#### Step 6: Test Login

1. Open browser to: http://localhost:5173
2. Try to login with Google
3. Should work without "invalid API key" error
4. Check browser console for: `Firebase Config: { apiKey: '✓ Set', ... }`

#### Step 7: Deploy to Production

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### Step 8: Verify Production

1. Go to: https://atlas-011.web.app
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. Or open in **incognito mode**
4. Try to login
5. Should work perfectly!

---

### Option 2: Create New Web App (Alternative)

If you want a completely fresh start:

#### Step 1: Create New Web App

1. Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Click **"Add app"** → Select **Web** (</> icon)
4. Give it a name: "ATLAS Web App v2"
5. Check **"Also set up Firebase Hosting"**
6. Click **"Register app"**

#### Step 2: Copy New Configuration

Firebase will show you the config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...NEW-KEY...",
  authDomain: "atlas-011.firebaseapp.com",
  databaseURL: "https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "atlas-011",
  storageBucket: "atlas-011.firebasestorage.app",
  messagingSenderId: "770708381517",
  appId: "1:770708381517:web:NEW-APP-ID"
};
```

#### Step 3: Update .env File

Copy the new values to your `.env` file:

```env
VITE_FIREBASE_API_KEY=<new-api-key>
VITE_FIREBASE_APP_ID=<new-app-id>
# Keep other values the same
```

#### Step 4: Test and Deploy

Follow steps 5-8 from Option 1 above.

---

## 🔒 Add API Key Restrictions (Highly Recommended)

After rotating, add restrictions to prevent abuse:

### Step 1: Go to Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: **atlas-011**

### Step 2: Find Your API Key

1. Look for **"Browser key (auto created by Firebase)"**
2. Click on the key name

### Step 3: Add Application Restrictions

1. Under **"Application restrictions"**
2. Select **"HTTP referrers (web sites)"**
3. Click **"Add an item"**
4. Add these referrers:
   ```
   https://atlas-011.web.app/*
   https://atlas-011.firebaseapp.com/*
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```
5. Click **"Done"**

### Step 4: Add API Restrictions

1. Under **"API restrictions"**
2. Select **"Restrict key"**
3. Select these APIs:
   - ✅ Identity Toolkit API
   - ✅ Token Service API
   - ✅ Firebase Installations API
   - ✅ Firebase Realtime Database API
   - ✅ Cloud Storage for Firebase API
4. Click **"Save"**

### Step 5: Test

1. Test your app: https://atlas-011.web.app
2. Login should still work
3. If not, check restrictions and adjust

---

## ✅ Verification Checklist

After rotation, verify:

- [ ] New API key copied from Firebase Console
- [ ] `.env` file updated with new key
- [ ] Old build artifacts deleted
- [ ] New build created: `npm run build`
- [ ] Local testing successful: `npm run dev`
- [ ] Login works locally
- [ ] Deployed to production: `firebase deploy`
- [ ] Production login works
- [ ] Browser cache cleared for testing
- [ ] API restrictions added (optional but recommended)
- [ ] Old API key disabled/deleted (optional)

---

## 🚨 Troubleshooting

### Issue: "API key not valid" after rotation

**Solution**:
1. Double-check the API key in `.env` file
2. Ensure no extra spaces or quotes
3. Rebuild: `npm run build`
4. Clear browser cache completely
5. Test in incognito mode

### Issue: "Missing Firebase configuration"

**Solution**:
1. Check `.env` file exists in project root
2. Verify all `VITE_FIREBASE_*` variables are set
3. Restart dev server
4. Check `public/config/firebase-config.json` was generated

### Issue: Restrictions blocking legitimate requests

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your API key
3. Check HTTP referrers include your domain
4. Add `http://localhost:*/*` for local development
5. Save and test again

---

## 📝 Important Notes

### What Happens to Old Key?

- Old key continues to work until you delete it
- You can have multiple keys active
- Recommended: Delete old key after confirming new one works

### How to Delete Old Key

1. Google Cloud Console → Credentials
2. Find the old API key
3. Click the trash icon
4. Confirm deletion

**⚠️ Only delete after confirming new key works!**

### Security Best Practices

1. **Rotate keys regularly** - Every 90 days recommended
2. **Always use restrictions** - Limit by domain and API
3. **Monitor usage** - Check Firebase Console for anomalies
4. **Never commit keys** - Always use environment variables
5. **Use different keys** - Separate keys for dev/staging/prod

---

## 🎯 Quick Reference

### Files to Update
- `G:\ATLAS\.env` - Add new API key here

### Commands to Run
```bash
# Clean and rebuild
Remove-Item -Recurse -Force dist
npm run build

# Test locally
npm run dev

# Deploy
firebase deploy --only hosting
```

### URLs to Visit
- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Your App: https://atlas-011.web.app

---

**Estimated Time**: 10-15 minutes  
**Difficulty**: Easy  
**Risk**: Low (old key works until you delete it)

🔄 **Ready to rotate? Follow the steps above!**
