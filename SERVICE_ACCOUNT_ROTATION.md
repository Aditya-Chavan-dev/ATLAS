# Service Account Key Rotation - Step-by-Step

## ⚠️ IMPORTANT: Do this AFTER Step 1 (Domain Restrictions)

## Step 2: Rotate Service Account Key

### Part A: Generate New Key

1. **Go to Firebase Console:**
   - URL: https://console.firebase.google.com
   - Select project: `atlas-011`

2. **Navigate to Service Accounts:**
   - Click ⚙️ **Project Settings** (gear icon in top-left)
   - Click **Service Accounts** tab

3. **Generate New Private Key:**
   - Scroll down to "Firebase Admin SDK"
   - Click **Generate New Private Key**
   - Click **Generate Key** in the confirmation dialog
   - A JSON file will download (e.g., `atlas-011-firebase-adminsdk-xxxxx.json`)

4. **IMPORTANT - Keep This File Secure:**
   - ⚠️ This file contains your private key
   - ⚠️ Never commit it to git
   - ⚠️ Never share it in Slack/email
   - ⚠️ Delete it after updating Render

### Part B: Update Render Environment Variables

1. **Open the Downloaded JSON File:**
   - Open it in a text editor (VS Code, Notepad, etc.)
   - Select ALL content (Ctrl+A)
   - Copy it (Ctrl+C)

2. **Go to Render Dashboard:**
   - URL: https://dashboard.render.com
   - Sign in if needed

3. **Select Your Backend Service:**
   - Find your backend service (should be named something like "atlas-backend")
   - Click on it

4. **Update Environment Variable:**
   - Click **Environment** in the left sidebar
   - Find `FIREBASE_SERVICE_ACCOUNT`
   - Click **Edit** (pencil icon)
   - Delete the old value
   - Paste the NEW JSON content (the entire file)
   - Click **Save Changes**

5. **Wait for Automatic Redeployment:**
   - Render will automatically redeploy your backend
   - This takes about 2-3 minutes
   - Watch the **Events** tab for deployment status

6. **Verify Deployment:**
   - Once deployed, click **Logs** tab
   - Look for: `✅ Firebase Admin SDK initialized successfully`
   - If you see errors, let me know immediately

### Part C: Delete Old Service Account Key

⚠️ **ONLY do this AFTER verifying the new key works!**

1. **Go Back to Firebase Console:**
   - Project Settings → Service Accounts

2. **Find the Old Key:**
   - You should see 2 keys listed now
   - The old one will have an earlier creation date

3. **Delete the Old Key:**
   - Click the trash icon (🗑️) next to the old key
   - Confirm deletion

4. **Verify Only One Key Remains:**
   - You should now see only the new key

### Part D: Clean Up

1. **Delete the Downloaded JSON File:**
   - Find the file on your computer
   - Delete it permanently (Shift+Delete)
   - Empty your Recycle Bin

2. **Clear Downloads History:**
   - Browser → Downloads → Remove from history

---

## ✅ Verification Checklist

After completing all steps:

- [ ] New service account key generated in Firebase
- [ ] Render environment variable updated
- [ ] Backend redeployed successfully
- [ ] Backend logs show successful Firebase initialization
- [ ] Old service account key deleted from Firebase
- [ ] Downloaded JSON file deleted from computer
- [ ] App still works (test login, dashboard, notifications)

---

## 🚨 Troubleshooting

### If Backend Fails to Deploy:

1. **Check Render Logs:**
   - Look for error messages
   - Common issue: Invalid JSON format

2. **Verify JSON Format:**
   - Make sure you copied the ENTIRE JSON file
   - Should start with `{` and end with `}`
   - Should include `"type": "service_account"`

3. **Rollback if Needed:**
   - Go back to Firebase Console
   - Generate another new key
   - Update Render again
   - Don't delete the old key until new one works

### If App Stops Working:

1. **Check Backend Logs:**
   - Look for Firebase initialization errors

2. **Test Backend Health:**
   - Go to: `https://your-backend.onrender.com/health`
   - Should return 200 OK

3. **Contact Me:**
   - Share the error logs
   - I'll help troubleshoot

---

**Ready to proceed? Complete Part A, then Part B, then Part C, then Part D.**

**Reply with "Step 2 complete" when done!**
