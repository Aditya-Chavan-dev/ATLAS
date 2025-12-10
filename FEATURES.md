# Project Features: Detailed Breakdown

This document outlines every feature currently implemented in the ATLAS application, including user-facing functionalities and backend systems.

## 1. Authentication & Security
- **Google Sign-In Integration**: Uses Firebase Authentication to allow users to sign in securely with their Google accounts.
- **Role-Based Access Control (RBAC)**: Distinct roles for **MD (Managing Director)** and **Employee**.
    - **Configuration**: Roles are determined by checking the user's email against two text files hosted in `public/config/`: `md-emails.txt` and `employee-emails.txt`. This allows for easy role management without redeploying.
    - **Routing**: Users are automatically redirected to their respective dashboards (MD or Employee) upon login based on their role.
    - **Protected Routes**: Middleware (`ProtectedRoute.jsx`) ensures users cannot access unauthorized pages (e.g., Employees cannot access MD pages).
- **Session Management**: Automatic token refresh and session persistence.
- **Logout Functionality**: Securely signs out the user and clears session data.

## 2. Employee Portal
### Dashboard (`Home.jsx`)
- **Real-time Status**: Displays current date, time, and attendance status (e.g., "Not Marked", "Present").
- **Quick Actions**: "Swipe/Click to Mark Attendance" button for checking in and out.
- **Summary Cards**: At-a-glance view of attendance stats for the current month.

### Attendance Management
- **Mark Attendance**:
    - **Window Restriction**: Logic to restrict marking attendance to specific hours (e.g., 9 AM - 6 PM) (if configured).
    - **Date/Time Validation**: Standardized date formats ("Do MMM YYYY") and time formats (12-hour AM/PM).
- **Attendance History (`History.jsx`)**:
    - **List View**: Chronological list of attendance records.
    - **Status Indicators**: Visual tags for "Present", "Absent", "Leave", "Holiday".
    - **Time Tracking**: Shows exact Check-In and Check-Out times.
- **Leave Application (`Leave.jsx`)**:
    - **Form Interface**: Fields for Start Date, End Date, Type (Sick, Casual, etc.), and Reason.
    - **Validation**: Prevents users from selecting past dates for new leave applications.
    - **Status Tracking**: Users can track the status of their leave requests (Pending, Approved, Rejected).

### Profile (`Profile.jsx`)
- **Personal Details**: View and edit generic profile information (Display Name, Contact).
- **Theme Preferences**: Toggle between Light and Dark modes.

## 3. MD Verification Portal (Managing Director)
### Dashboard (`Dashboard.jsx`)
- **High-Level Statistics**: Total Employees, Present Today, On Leave, Late Arrivals.
- **Visual Charts**: Graphical representation of attendance trends over the week/month.
- **Toggle Views**: Switch between Summary Cards and Calendar Grid view for data visualization.

### Approvals System (`Approvals.jsx`)
- **Correction Requests**: Handles requests from employees to fix incorrect attendance records.
- **Smart Logic**: Requests are only generated/sent if the proposed correction is *different* from the current record.
- **Action Interface**: MD can "Approve" (updates database) or "Reject" (notifies employee) requests.
- **Audit Logging**: Keeps track of who approved what and when.

### Employee Management (`Profiles.jsx`, `ProfileDetail.jsx`)
- **Employee Directory**: Searchable and filterable list of all employees.
- **Detailed Profiles**: Click on an employee to view their full attendance history, contact info, and role status.
- **Engagement Stats**: "Present Days" count vs raw "Present" status to accurately reflect working days.
- **Dual-MD Support**: Special logic to handle attendance for a second MD (automatically marked as "Office" for working days, editable by Primary MD).

### Reporting & Export (`Export.jsx`)
- **Excel Export**: Download attendance data as `.xlsx` files.
- **Flexible Ranges**: Options to export data for the last 1 Month, 3 Months, 6 Months, or 1 Year.
- **Formatted Reports**: Exports are styled and organized for immediate use in payroll/HR processing.

## 4. Notifications System
- **FCM Integration**: Uses Firebase Cloud Messaging for push notifications.
- **Service Worker**: Handle background notifications even when the app is closed (via PWA capabilities).
- **Automated Reminders (Backend Cron Jobs)**:
    - **Morning Reminder (10:00 AM IST)**: Sent to employees who haven't checked in yet.
    - **Evening Reminder (5:00 PM IST)**: Urgent reminder for missing attendance.
- **Targeting Logic**: Server fetches current attendance status and filters users who need reminders to avoid spamming those already present.

## 5. UI/UX & Design System
- **Modern Aesthetic**:
    - **Glassmorphism**: Translucent cards and backgrounds for a premium feel.
    - **Hero Geometric Login**: Custom geometric animation on the login page.
    - **Vibrant Color Palette**: uses HSL-based dynamic coloring.
- **Responsiveness**:
    - **Mobile-First**: Fully functional on smartphones.
    - **Collapsible Sidebar**: Navigation sidebar adapts to screen size (Hamburger menu on mobile, persistent on desktop).
- **PWA (Progressive Web App)**:
    - **Installable**: Can be added to the home screen as a native-like app.
    - **Offline Support**: Basic functionality cached via Service Workers.
    - **Custom Assets**: Specific icons ("ATLAS only .jpg") configured for home screen visibility.
- **Theme Engine**: Built-in support for multiple color themes and Dark Mode.

## 6. Backend & Infrastructure
- **Node.js Express Server**: Handles business logic that requires server-side execution (Cron jobs, heavy processing).
- **Firebase Realtime Database / Firestore**: Stores user data, attendance records, and leave requests with real-time synchronization.
- **CORS Configuration**: Secure cross-origin resource sharing setup.
- **Timezone Handling**: All server-side times are explicitly converted to IST (Indian Standard Time) for accurate reminders.
