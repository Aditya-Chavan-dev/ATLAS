# Debug Checklist for 403 Forbidden Error

## Issue
Frontend gets `403 Forbidden` when accessing `/api/attendance/*`, but backend logs show **NO incoming requests**.

## Root Cause Analysis
The Service Worker (PWA) is intercepting API calls and preventing them from reaching the backend.

## Solution Steps

### Step 1: Open in Incognito/Private Window
**This bypasses ALL cached data, including Service Workers.**

1. Open a **new Incognito/Private window** (Ctrl+Shift+N in Chrome/Edge)
2. Navigate to `http://localhost:5173` (your frontend dev server)
3. Login and try marking attendance
4. Check if the **backend terminal** shows logs like `[2024-...] GET /api/attendance/today`

**If logs appear:** Service Worker was the problem. Proceed to Step 2.
**If no logs:** Go to Step 3.

---

### Step 2: Clear Service Worker from Normal Browser
1. Close the app
2. Open browser DevTools (F12)
3. Go to **Application** tab → **Service Workers**
4. Click **Unregister** for all listed workers
5. Go to **Application** tab → **Storage**
6. Click **Clear site data**
7. Reload the page

---

### Step 3: Verify Firebase Project IDs Match
The token from the frontend must be validated by the backend using the **same Firebase project**.

**Check Frontend Project ID:**
1. Open `frontend/.env`
2. Look for `VITE_FIREBASE_PROJECT_ID=...`
3. Copy that value

**Check Backend Project ID:**
1. Open `backend/config/serviceAccountKey.json`
2. Look for the `project_id` field
3. Compare with frontend

**If they DON'T match:** You're using different Firebase projects. Replace `serviceAccountKey.json` with the key from the correct project.

---

### Step 4: Test Backend Directly
Open a new terminal and run:

```bash
curl http://localhost:5000/api/health
```

**Expected:** `{"status":"OK","message":"ATLAS Backend is running"}`

If this fails, the backend isn't running on port 5000.

---

### Step 5: Hard Refresh Frontend
1. Stop the frontend (`Ctrl+C` in the terminal running `npm run dev`)
2. Delete `frontend/dist` folder (if it exists)
3. Restart: `npm run dev`
4. Open in **Incognito** again

---

## Next Steps
Once you complete Step 1, let me know what happens (logs appear or not).
