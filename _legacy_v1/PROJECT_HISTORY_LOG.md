# ATLAS Project History Log

This document serves as a consolidated history of the ATLAS project, containing all legacy documentation, architectural decisions, security audits, and deployment records.

---

## 1. Project Overview & Features

### System Overview
ATLAS is an Enterprise Attendance Management System built as a Progressive Web App (PWA). It facilitates location-based attendance marking for employees and provides a comprehensive dashboard for Managing Directors (MDs) to approve/reject requests and monitor workforce status in real-time.

### Key Features
- **Google Sign-In Integration**: Uses Firebase Authentication.
- **Role-Based Access Control (RBAC)**: MD (Managing Director) and Employee roles.
- **Employee Portal**: Dashboard, Attendance History, Leave Application, Profile.
- **MD Verification Portal**: Statistics, Approvals System, Employee Management, reporting & Export.
- **Notifications System**: FCM Integration, Automated Reminders (Cron), Manual "Send Reminder" button.

---

## 2. Technical Stack & Concepts

### Frontend Core
- **React 19**: UI framework.
- **Vite 6/7**: Build tool & dev server.
- **Tailwind CSS 3.4**: Styling.
- **Framer Motion 12**: Animations.
- **Lucide React**: Icons.
- **Headless UI**: Accessible components.

### Backend & Infrastructure
- **Node.js (Express)**: REST API.
- **Firebase Realtime Database**: Real-time sync.
- **Firebase Cloud Messaging (FCM)**: Push notifications.
- **ExcelJS / XLSX**: Spreadsheet generation.
- **Node Cron**: Task scheduling (10 AM & 5 PM IST).

### Architectural Decisions
- **SPA**: Smooth state transitions.
- **BFF (Backend for Frontend)**: Heavy logic move to Node.js.
- **PWA**: Installable, offline capabilities.
- **Stateless API**: Token-based authentication.

---

## 3. Deployment & Environment Records

### Deployment Status (Historical)
- **Frontend**: https://atlas-011.web.app (Firebase Hosting)
- **Backend**: https://atlas-backend-gncd.onrender.com (Render)
- **Auth System**: Verified working as of 2025-12-12 (Frozen state).

### Setup and Guides
- **Environment Variables**: Managed via `.env` (VITE_ prefixes).
- **Service Worker Config**: Generated at build time.
- **Notification Testing**: Manual API triggers (`/api/trigger-reminder`) and scheduled cron jobs.
- **API Key Rotation**: Documented process for regenerating and restricting Google Cloud keys.

---

## 4. Security Audits & Remediation

### Security Incidents
- **Exposed Secrets (2025-12-12)**: Hardcoded API keys were found in git history and source.
- **Remediation**: 
  - Removed hardcoded fallbacks.
  - Implemented `.env` and `.gitignore` enhancements.
  - Rotated API keys in Google Cloud Console.
  - Added HTTP Referrer and API restrictions.

### Best Practices
- **Least Privilege**: Role-based access.
- **Zero Trust**: Backend validation of all actions.
- **Pre-commit protection**: Husky hooks to block secrets.

---

## 5. Major Feature Updates

### Universal Notification System (Banner Updates)
- Moved notifications from client-side to Node.js backend to ensure transactional integrity.
- Implemented "Banner" style notifications that stay visible until dismissed.
- Added interaction buttons ("Mark Attendance", "Dismiss") to notifications.
- Switched to topic-based (`atlas_all_users`) broadcasting for reminders.

### Send Reminder Feature
- Added MD-controlled button to trigger manual reminders.
- Shows real-time feedback on notification delivery counts.

---

## 6. Development History & Bug Fixes

### Notable Issues Resolved
- **Auth Key Caching**: Aggressive service worker caching caused "Invalid API Key" errors even after rotation. Resolved by cache-busting and manual clearing.
- **Timezone Consistency**: Forced IST (UTC+5:30) for cron jobs running on Render (UTC).
- **Modal Layering**: Applied high z-index (2000) to modals to fix UI overlaps on sidebar.
- **Excel Export Formatting**: Fixed CommonJS import issues in the backend controller and added dynamic formatting for Sundays (yellow) and Leaves (green).
- **App 404 on Refresh**: Fixed by adding `404.html` fallback and rewrite rules in `firebase.json`.

---

*Note: This log is a consolidation of legacy `.md` files removed on 2025-12-18.*
