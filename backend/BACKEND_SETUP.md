# Backend Setup Guide

To make the backend work, you need to configure Firebase Admin credentials.

## 1. Get Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Select your project **"ATLAS"**.
3. Click the **Gear icon** (Settings) > **Project settings**.
4. Go to the **Service accounts** tab.
5. Click **Generate new private key**.
6. Click **Generate key** to download the JSON file.
7. Rename the downloaded file to `serviceAccountKey.json`.
8. Move this file to the `backend` folder: `g:\ATLAS\backend\serviceAccountKey.json`.

## 2. Update Database URL
1. In Firebase Console, go to **Build** > **Realtime Database**.
2. Copy the URL shown at the top (e.g., `https://your-project-id-default-rtdb.firebaseio.com/`).
3. Open `g:\ATLAS\backend\.env`.
4. Update `FIREBASE_DATABASE_URL` with the copied URL.

## 3. Restart Backend
1. Open a terminal in `g:\ATLAS\backend`.
2. Run `npm start` (or `node server.js`).
3. You should see "Firebase Admin Initialized" and "Server running on port 5000".

## 4. Test
Once the backend is running with the correct credentials, you can run the test script:
```bash
node test_api_flow.js
```
