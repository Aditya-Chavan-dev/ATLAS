# Quick Fix: Get New Firebase API Key

## The Problem
Your current API key `AIzaSyAeDXg4T16u3lCNDxHfyA7n3WQCrPp4MAA` is restricted and blocking:
- ❌ localhost:5173
- ❌ atlas-011.web.app (deployed site)

## Solution: Get Unrestricted Web API Key

### Step 1: Go to Firebase Console
Open: https://console.firebase.google.com/project/atlas-011/settings/general

### Step 2: Find Your Web App
- Scroll down to "Your apps" section
- Look for your web app (or click "Add app" → Web if none exists)

### Step 3: Get the Config
- Click the "Config" button (or gear icon)
- You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...NEW_KEY_HERE",  // ← Copy this
  authDomain: "atlas-011.firebaseapp.com",
  projectId: "atlas-011",
  // ...
};
```

### Step 4: Update Your .env File
1. Open `config/.env`
2. Replace line 1:
   ```
   VITE_FIREBASE_API_KEY=YOUR_NEW_KEY_HERE
   ```
3. Save the file

### Step 5: Rebuild and Redeploy
```bash
# Stop dev server (Ctrl+C)
npm run build
firebase deploy --only hosting
```

### Step 6: Test
- Deployed: https://atlas-011.web.app
- Local: `npm run dev` → http://localhost:5173

---

## Alternative: Remove API Key Restrictions

If you want to keep the same key:

1. Go to: https://console.cloud.google.com/apis/credentials?project=atlas-011
2. Find key: `AIzaSyAeDXg4T16u3lCNDxHfyA7n3WQCrPp4MAA`
3. Click Edit
4. Under "Application restrictions" → Select **"None"**
5. Save
6. Wait 2 minutes, then refresh your browser

---

## Which Option?

**Option 1** (Get new key): Faster, guaranteed to work  
**Option 2** (Remove restrictions): Keeps existing key but less secure

I recommend **Option 1** - get the new key from Firebase Console.
