# ATLAS Technical Documentation

This document provides a comprehensive overview of the technical concepts, architecture, and libraries used in the ATLAS Attendance Management System.

---

## 🚀 Core Technology Stack

- **Frontend**: React 19, Vite 6/7, Tailwind CSS 3.4
- **Backend**: Node.js (Express)
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google Sign-In)
- **Notifications**: Firebase Cloud Messaging (FCM) + Floating In-App Banner
- **Deployment**: Firebase Hosting (Frontend), Render (Backend)

---

## ⚛️ React Concepts & Implementation

### 1. Functional Components & Hooks
We exclusively use functional components with standard and custom hooks for logic encapsulation.
- **`useState`**: For local component state management.
- **`useEffect`**: For side effects (database listeners, API calls).
- **Custom Hooks**:
  - `useAuth`: Accesses user profile and authentication status.
  - `useConnectionStatus`: Monitors online/offline state.

### 2. Context API
Used for global state management without prop drilling:
- **`AuthContext`**: Manages the currently logged-in user, their role, and profile data from Firebase.
- **`ThemeContext`**: Manages light/dark mode state and persistent user preferences.

### 3. React Router 7
Handles client-side routing with nested layouts:
- **Role-Based Routing**: Conditional rendering in `App.jsx` ensures MDs see the MD portal and Employees see the Employee portal.
- **Navigation Guards**: Logic in `AppContent` handles redirections for unauthenticated users.

### 4. Progressive Web App (PWA)
- **Service Workers**: Automated via `vite-plugin-pwa` for asset caching and background push notifications.
- **Web Manifest**: Configures the app to be installable on mobile devices with a native look and feel.

---

## 🟢 Node.js & Backend Concepts

### 1. Express.js Architecture
- **MVC Pattern**: Controllers handle the logic (`notificationController`, `exportController`), while routes define the endpoints.
- **Middleware**: Used for JSON parsing and CORS configuration.

### 2. Firebase Admin SDK
Used for privileged operations that shouldn't happen on the client:
- **Cloud Messaging (FCM)**: Sending push notifications to specific tokens or topics.
- **Database Access**: Direct reference to Realtime Database for administrative tasks.

### 3. Automated Tasks (Cron Jobs)
- **`node-cron`**: Schedules reminders at 10:00 AM and 5:00 PM IST.
- **Timezone Handling**: Explicitly converts server time to Indian Standard Time (IST) to ensure consistency.

### 4. Excel Generation
- **`ExcelJS`**: Generates complex spreadsheets on the server with dynamic formatting, cell coloring, and custom column widths.

---

## 🔥 Firebase Services

### 1. Realtime Database (RTDB)
- **NoSQL Structure**: Data is stored as a JSON tree.
- **Realtime Listeners**: Frontend components use `onValue` to update the UI instantly when data changes in the database.

### 2. Firebase Authentication
- **OAuth (Google)**: Simplifies user onboarding and ensures secure identity verification.
- **Auth Persistence**: Configured to `LOCAL` to keep users signed in across browser sessions.

---

## 🎨 UI/UX Design System

- **Glassmorphism**: A design aesthetic using transparency, blur, and subtle borders (implemented via Tailwind's `backdrop-blur`).
- **Utility-First CSS**: Tailwind CSS allows for rapid, consistent styling directly in the markup.
- **Responsive Design**: Mobile-first approach with flexible grids and collapsible navigation for desktop.
- **Micro-animations**: Framer Motion is used for smooth transitions and the hero login animation.

---

*Last Updated: 2025-12-18*
