# ATLAS Backend - Render Deployment Guide

## Prerequisites
1. GitHub account
2. Render account (free tier available at https://render.com)
3. Firebase Service Account JSON

## Step 1: Push Backend to GitHub

If you haven't already, initialize a git repository in the backend folder:

```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
```

Create a new repository on GitHub (e.g., `ATLAS-backend`) and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ATLAS-backend.git
git branch -M main
git push -u origin main
```

## Step 2: Get Firebase Service Account

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (atlas-011)
3. Click the gear icon ⚙️ > Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. **IMPORTANT**: Copy the entire JSON content - you'll need it for Render

## Step 3: Deploy to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (ATLAS-backend)
4. Configure the service:

   **Name**: `atlas-backend` (or your preferred name)
   
   **Environment**: `Node`
   
   **Build Command**: `npm install`
   
   **Start Command**: `npm start`
   
   **Plan**: Free

5. Click "Advanced" and add Environment Variables:

   **FIREBASE_SERVICE_ACCOUNT**
   - Paste the entire JSON from the service account file
   - It should look like: `{"type":"service_account","project_id":"atlas-011",...}`
   
   **FIREBASE_DATABASE_URL**
   - Value: `https://atlas-011-default-rtdb.firebaseio.com`
   
   **PORT**
   - Render sets this automatically, but you can add: `5000`

6. Click "Create Web Service"

## Step 4: Wait for Deployment

Render will:
- Clone your repository
- Run `npm install`
- Start your server with `npm start`
- Provide you with a URL like: `https://atlas-backend-xxxx.onrender.com`

This takes about 2-5 minutes.

## Step 5: Test the Backend

Once deployed, test the health endpoint:
```
https://your-render-url.onrender.com/api
```

You should see:
```json
{
  "status": "active",
  "service": "ATLAS Notification Server",
  "timestamp": "...",
  "version": "2.0.0 (Refactored)"
}
```

## Step 6: Update Frontend

1. Update `g:\ATLAS\.env` (or create if it doesn't exist):
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   ```

2. Rebuild frontend:
   ```bash
   cd g:\ATLAS
   npm run build
   ```

3. Redeploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

## Step 7: Test Excel Export

1. Go to https://atlas-011.web.app
2. Login as MD
3. Navigate to Export page
4. Select a month
5. Click "Download Excel Sheet"
6. The file should download successfully!

## Troubleshooting

### Backend won't start on Render
- Check the logs in Render dashboard
- Verify FIREBASE_SERVICE_ACCOUNT is valid JSON
- Ensure all dependencies are in package.json

### Excel export fails
- Check if backend URL is correct in frontend .env
- Verify CORS is enabled in backend (already configured)
- Check Render logs for errors

### Push notifications not working
- Verify Firebase service account has correct permissions
- Check that FCM tokens are being saved in Firebase
- Review notification controller logs

## Important Notes

1. **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds.

2. **Environment Variables**: Never commit `.env` files or service account JSON to GitHub.

3. **CORS**: Already configured to allow all origins. For production, update to specific domain:
   ```javascript
   app.use(cors({ origin: 'https://atlas-011.web.app' }))
   ```

4. **Scheduled Jobs**: The cron jobs (10 AM and 5 PM IST notifications) will run automatically on Render.

## Your Backend URL

After deployment, your backend will be available at:
```
https://atlas-backend-XXXX.onrender.com
```

Replace XXXX with your actual Render subdomain.

## Support

If you encounter issues:
1. Check Render logs: Dashboard > Your Service > Logs
2. Verify environment variables are set correctly
3. Test endpoints individually using Postman or browser
