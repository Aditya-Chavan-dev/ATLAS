# ATLAS Backend

Node.js backend server for ATLAS Attendance System with push notifications and Excel export functionality.

## Features

- ✅ Push Notifications (FCM)
- ✅ Leave Management API
- ✅ Scheduled Reminders (10 AM & 5 PM IST)
- ✅ Excel Attendance Report Export
- ✅ Firebase Realtime Database Integration

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Add your Firebase credentials to `.env`

4. Start server:
```bash
npm start
```

Server runs on http://localhost:5000

## API Endpoints

### Health Check
- `GET /api` - Server status

### Leave Management
- `POST /api/leave/apply` - Apply for leave
- `POST /api/leave/approve` - Approve leave
- `POST /api/leave/reject` - Reject leave
- `POST /api/leave/cancel` - Cancel leave
- `GET /api/leave/history/:employeeId` - Get leave history
- `GET /api/leave/pending` - Get pending leaves

### Notifications
- `POST /api/trigger-reminder` - Trigger attendance reminder
- `POST /api/send-test` - Send test notification
- `GET /api/pending-employees` - Get employees with pending attendance

### Export
- `GET /api/export-attendance-report?month=MM&year=YYYY` - Download Excel report

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Render.

## Environment Variables

Required environment variables:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_DATABASE_URL=https://atlas-011-default-rtdb.firebaseio.com
PORT=5000
```

## Scheduled Jobs

- **10:00 AM IST (Mon-Sat)**: Morning attendance reminder
- **05:00 PM IST (Mon-Sat)**: Afternoon attendance reminder

## Tech Stack

- Node.js + Express
- Firebase Admin SDK
- ExcelJS (for report generation)
- node-cron (for scheduled tasks)
- CORS enabled

## License

Private - ATLAS Attendance System
