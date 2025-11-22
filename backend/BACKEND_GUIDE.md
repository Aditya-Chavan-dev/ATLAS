# ATLAS Backend Guide

This directory contains the Node.js/Express backend for the ATLAS application. It handles API requests, authentication, and interaction with the Firebase Realtime Database.

## Directory Structure

- **config/**: Configuration files (Firebase Admin setup).
- **controllers/**: Logic for handling API requests (Attendance, Employee, Leave).
- **routes/**: API route definitions.
- **middleware/**: Custom middleware (e.g., Authentication).
- **server.js**: Main entry point.

## Setup & Configuration

### Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### Firebase Credentials
1. Generate a new private key from your Firebase Project Settings > Service Accounts.
2. Save the file as `serviceAccountKey.json`.
3. Place it in the `backend/config/` directory.

> **IMPORTANT**: Never commit `.env` or `serviceAccountKey.json` to version control.

## API Endpoints

### Authentication
Authentication is handled via Firebase Client SDK on the frontend. The backend verifies the ID token sent in the `Authorization` header.

### Employees (`/api/employees`)
- `POST /create`: Create a new employee (Admin/Manager only).
- `GET /`: Get all employees.
- `GET /:uid`: Get specific employee details.

### Attendance (`/api/attendance`)
- `POST /mark`: Mark attendance (requires `uid`, `type`, `status`, `location` if applicable).
- `PUT /edit/:attendanceId`: Edit an attendance record.
- `GET /today/:uid`: Get today's attendance for an employee.
- `GET /history/:uid`: Get attendance history.
- `GET /pending-approvals`: Get pending attendance requests (Manager only).
- `POST /approve`: Approve a request.
- `POST /reject`: Reject a request.

### Leave (`/api/leave`)
- `POST /apply`: Apply for leave.
- `GET /pending`: Get pending leave requests.
- `POST /update-status`: Approve/Reject leave.

## Deployment (Render)

The backend is configured for deployment on Render using the `render.yaml` blueprint in the root directory.
Ensure you add the `serviceAccountKey.json` content as a "Secret File" in Render settings.
