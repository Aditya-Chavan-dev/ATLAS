# ATLAS – Attendance Tracking & Logging Automation System (MD–Employee Model)

### 🧾 Project Context

This project was developed under a **freelance contract** for **Autoteknic**, executed between **7th October 2025** and **27th December 2025**.
ATLAS is a **production-grade internal automation system** designed to digitalize attendance tracking, leave management, and approval workflows between employees and top management (MD).

---

### 📘 Overview

**ATLAS (Attendance Tracking & Logging Automation System)** is a cross-platform, real-time solution built with **React**, **Node.js**, and **Firebase Realtime Database**. It revolutionizes how organizations manage attendance by providing **instant synchronization**, **automated notifications**, and **paperless approval cycles** — optimized for both desktop and mobile interfaces.

---

## 🚀 Core Idea

Employees mark attendance, apply for leave, or update work status directly through a responsive mobile-first interface. Each action triggers a **real-time push notification** to the Managing Director (MD), who can **approve or reject** it immediately from their web dashboard or mobile app.
All records are logged in Firebase, creating a **transparent**, **tamper-proof**, and **auditable** attendance system.

---

## 🧩 Key Features

### 👨‍💼 Employee Module (Web + Mobile)

* **Login & Registration:**
  One-time setup capturing first name, last name, and mobile number stored in Firebase.
* **Mark Attendance:**
  Choose between:

  * **Office** (default)
  * **Site** (with dynamic text input for site name)
* **Leave Management:**
  Employees can apply for leave; once approved, attendance prompts are automatically suspended during the leave duration.
* **Real-time Feedback:**
  Visual confirmation for approvals and rejections.
* **Guest Mode (Demo):**
  Recruiters and visitors can explore ATLAS in a safe demo environment using **dummy data**, isolated from live operations.

---

### 👑 Managing Director (MD) Module (Web + Mobile)

* **Instant Notifications:**
  Real-time alerts upon employee attendance or leave actions.
* **One-Tap Approvals:**
  Approve or reject directly from the notification (✔ or ✖).
* **Comprehensive Dashboard:**
  Centralized logs for attendance, leave records, and decisions.
* **Report Generation:**
  Export summaries for specific timeframes in structured formats.
* **Notification Management:**
  Filter, mute, or customize alerts as needed.

---

## 🧠 System Highlights

**Tech Stack**

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | React.js (Web + PWA for Mobile)         |
| Backend        | Node.js + Express.js                    |
| Database       | Firebase Realtime Database (NoSQL)      |
| Authentication | Firebase Auth (Email/Password or Phone) |
| Notifications  | Firebase Cloud Messaging (FCM)          |
| Hosting        | Firebase Hosting / Render / Vercel      |

---

## 📱 Cross-Platform Deployment

* **Employee App:**
  Deployable as a **PWA (Progressive Web App)** and installable **APK**, hosted on the official website for direct download.
* **MD Dashboard:**
  Accessible via secure web login or mobile browser with identical credentials.

---

## 🔁 Workflow Summary

1. Employee logs in and completes one-time profile setup.
2. Employee marks attendance (Office/Site) or applies for leave.
3. MD receives instant push notification.
4. MD approves/rejects directly from notification.
5. Firebase syncs updates in real-time across all clients.
6. Reports generated and exported through the MD dashboard.
7. Guest Mode operates independently for demo sessions.

---

## 🧰 Firebase Features Used

* **Firebase Authentication** – Secure login and session management.
* **Realtime Database** – Instant, NoSQL-based synchronization.
* **Cloud Messaging (FCM)** – Real-time push notifications.
* **Firebase Hosting** – PWA and dashboard deployment.
* *(Optional)* **Storage** – For exportable reports or document uploads.

---

## ⚙️ Setup Instructions

### Prerequisites

* Node.js (v18+)
* Firebase CLI (`npm install -g firebase-tools`)
* GitHub Account (for source control and CI/CD)

### Steps

1. **Clone Repository**

   ```bash
   git clone https://github.com/<your-username>/ATLAS.git
   cd ATLAS
   ```
2. **Install Dependencies**

   ```bash
   npm install
   ```
3. **Initialize Firebase**

   ```bash
   firebase init
   ```

   Choose:

   * **Realtime Database**
   * **Hosting**
   * *(Optional)* **Functions**
   * Configure as **Single Page App**
4. **Run Locally**

   ```bash
   npm start
   ```
5. **Deploy**

   ```bash
   firebase deploy
   ```

---

## 💾 Folder Structure

```
ATLAS/
│
├── client/                     # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── assets/             # Images, icons, logos
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DashboardCard.jsx
│   │   │   └── Loader.jsx
│   │   │
│   │   ├── pages/              # Page-level components (Routing targets)
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── GuestMode.jsx
│   │   │
│   │   ├── context/            # React Context (Auth, Theme, App)
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   │
│   │   ├── services/           # Firebase and API config
│   │   │   ├── firebase.js     # Firebase initialization + exports
│   │   │   ├── authService.js
│   │   │   ├── dbService.js
│   │   │   └── storageService.js
│   │   │
│   │   ├── styles/             # Centralized CSS or Tailwind config
│   │   │   ├── index.css
│   │   │   └── theme.css
│   │   │
│   │   ├── App.js
│   │   ├── index.js
│   │   └── routes.js           # Centralized route definitions
│   │
│   ├── .env                    # Environment variables (API keys, etc.)
│   ├── package.json
│   └── vite.config.js          # If using Vite (optional)
│
├── server/                     # Firebase backend (optional Cloud Functions)
│   ├── functions/
│   │   ├── index.js
│   │   ├── package.json
│   │   └── utils/
│   │       ├── attendanceHandler.js
│   │       ├── reportGenerator.js
│   │       └── emailNotification.js
│   │
│   └── firebase.json           # Config for hosting, functions, storage
│
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage rules
├── .firebaserc                 # Firebase project alias and configuration
├── .gitignore
├── LICENSE
└── README.md

```

---

## 🔒 License

Licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Aditya Chavan**
Freelance Software Developer — Contract with **Autoteknic**
Project Duration: *7 Oct 2025 – 27 Dec 2025*

> "Make it simple, but significant." — Don Draper

