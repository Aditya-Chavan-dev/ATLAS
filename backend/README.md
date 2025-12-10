# ATLAS Notification Server

Push notification backend for the ATLAS attendance system.

## Features
- 🔔 **10 AM IST** - Morning attendance reminder (Mon-Sat)
- ⚠️ **5 PM IST** - Afternoon reminder for pending employees
- 📡 Real-time FCM push notifications

## Deployment on Render

### Step 1: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/project/atlas-011/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Download the JSON file
4. Copy the **entire contents** of the JSON file

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `atlas-notification-server`
   - **Root Directory**: `atlas-app/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Add Environment Variables

In Render's Environment tab, add:

| Key | Value |
|-----|-------|
| `FIREBASE_SERVICE_ACCOUNT` | (Paste entire JSON from Step 1) |
| `FIREBASE_DATABASE_URL` | `https://atlas-011-default-rtdb.firebaseio.com` |

### Step 4: Deploy

Click **"Create Web Service"** - Render will automatically deploy.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/trigger-reminder` | POST | Manually trigger attendance reminder |
| `/api/send-test` | POST | Send test notification to specific token |
| `/api/pending-employees` | GET | List employees without today's attendance |

## Local Development

```bash
# Create .env file
cp .env.example .env

# Add your Firebase service account JSON to .env
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Start server
npm run dev
```

## Scheduled Jobs

| Time (IST) | Cron (UTC) | Description |
|------------|------------|-------------|
| 10:00 AM | `30 4 * * 1-6` | Morning reminder |
| 5:00 PM | `30 11 * * 1-6` | Afternoon reminder |
