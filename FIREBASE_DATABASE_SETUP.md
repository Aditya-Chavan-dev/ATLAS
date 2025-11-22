# FIREBASE REALTIME DATABASE SETUP

## Problem Found
Your `backend/.env` has:
```
FIREBASE_DATABASE_URL=https://atlas-placeholder.firebaseio.com
```

This is a placeholder - not a real database! That's why attendance marking hangs.

## Solution: Create Firebase Realtime Database

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Click on your project **atlas-011**

### Step 2: Create Realtime Database
1. In the left sidebar, click **Build** → **Realtime Database**
2. Click **Create Database**
3. Choose a location (e.g., **us-central1**)
4. Start in **Test Mode** (we'll secure it later)
5. Click **Enable**

### Step 3: Get the Database URL
After creation, you'll see a URL at the top like:
```
https://atlas-011-default-rtdb.firebaseio.com/
```

**Copy this EXACT URL**

### Step 4: Update backend/.env
1. Open `backend/.env`
2. Replace the placeholder with your real URL:
   ```
   FIREBASE_DATABASE_URL=https://atlas-011-default-rtdb.firebaseio.com
   ```
   (Use YOUR actual URL, not this example)

### Step 5: Restart Backend
```powershell
# Stop the backend (Ctrl+C)
# Then restart:
cd G:\ATLAS\backend
node server.js
```

### Step 6: Test Again
Try marking attendance - it should work now!

---

## Database Security (Do This After Testing)

Once it works, secure your database:

1. In Firebase Console → Realtime Database → **Rules** tab
2. Replace with:
```json
{
  "rules": {
    ".read": "auth != null",  
    ".write": "auth != null"
  }
}
```
3. Click **Publish**

This ensures only authenticated users can access the database.
