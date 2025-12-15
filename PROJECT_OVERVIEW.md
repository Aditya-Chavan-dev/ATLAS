# 📱 ATLAS - Attendance Tracking & Leave Application System

## 🎯 Project Description

**ATLAS** is a full-stack **Progressive Web Application (PWA)** for enterprise attendance management. It provides a dual-portal system for **Employees** to mark attendance and apply for leaves, and for **Managing Directors (MD)** to oversee, approve, and export attendance data. The app features real-time sync, push notifications, and a modern glassmorphism UI.

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with latest concurrent features |
| **Vite 6** | Lightning-fast build tool & dev server |
| **React Router 7** | Client-side routing & navigation |
| **TailwindCSS 3** | Utility-first CSS framework |
| **Framer Motion** | Smooth animations & transitions |
| **Lucide React** | Modern icon library |
| **Headless UI** | Accessible UI components |

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server for notifications & exports |
| **Firebase Admin SDK** | Server-side Firebase operations |
| **node-cron** | Scheduled automated reminders |
| **ExcelJS** | Server-side Excel generation |

### **Database & Services**
| Service | Purpose |
|---------|---------|
| **Firebase Realtime Database** | Real-time data sync for attendance |
| **Firebase Authentication** | Google Sign-In & session management |
| **Firebase Cloud Messaging (FCM)** | Push notifications to employees |
| **Firebase Hosting** | Deployed frontend hosting |

### **PWA Features**
| Feature | Technology |
|---------|------------|
| **Installable App** | vite-plugin-pwa |
| **Offline Support** | Service Workers |
| **Push Notifications** | FCM + Background Sync |

---

## ✨ Key Features

### 🔐 **1. Authentication & Security**
- **Google Sign-In** via Firebase Auth
- **Role-Based Access Control (RBAC)**
  - MD (Managing Director) portal
  - Employee portal
- **Protected Routes** - Unauthorized access prevention
- **Session persistence** with automatic token refresh

---

### 👤 **2. Employee Portal**

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time date/time, quick mark attendance button |
| **Mark Attendance** | Time-window restricted (9 AM - 6 PM) |
| **History** | View past attendance with status indicators |
| **Leave Application** | Apply for leaves with date validation |
| **Profile** | Edit name, toggle dark/light theme |

---

### 👔 **3. MD (Admin) Portal**

| Feature | Description |
|---------|-------------|
| **Dashboard** | High-level stats (Total, Present, Leave, Late) |
| **Approvals** | Approve/Reject attendance correction requests |
| **Employee Directory** | Searchable list with detailed profiles |
| **Profile Details** | Individual attendance history & stats |
| **Excel Export** | Download 1/3/6/12 month reports |
| **Send Reminder** | Push notification to all employees |

---

### 🔔 **4. Notifications System**
- **FCM Push Notifications** for attendance reminders
- **Automated Cron Jobs:**
  - 🌅 **10:00 AM** - Morning check-in reminder
  - 🌆 **5:00 PM** - Evening reminder for missing attendance
- **Manual "Send Reminder"** button for MD
- Smart targeting (only sends to employees who haven't marked)

---

### 🎨 **5. UI/UX Design**
- **Glassmorphism** - Frosted glass card effects
- **Geometric Hero Animation** on login page
- **Dark/Light Theme** toggle
- **Mobile-First Responsive** design
- **Collapsible Sidebar** (hamburger on mobile)
- **Smooth Micro-animations** with Framer Motion

---

### 📊 **6. Data Export**
- **Client-side Excel export** using ExcelJS + xlsx
- **Formatted reports** ready for HR/Payroll
- **Flexible date ranges** (1M, 3M, 6M, 12M)

---

## 📂 Project Structure

```
ATLAS/
├── src/                    # Frontend React app
│   ├── employee/           # Employee portal pages
│   │   ├── pages/          # Home, History, Leave, Profile
│   │   └── components/     # Employee-specific components
│   ├── md/                 # MD admin portal pages
│   │   └── pages/          # Dashboard, Approvals, Profiles, Export
│   ├── components/         # Shared UI components
│   ├── context/            # React contexts (Auth, Theme)
│   ├── firebase/           # Firebase config
│   ├── services/           # FCM, API services
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Helpers (Excel export, date formatting)
│
├── backend/                # Node.js Express server
│   └── src/
│       ├── controllers/    # Notification, Export controllers
│       ├── routes/         # API endpoints
│       ├── services/       # FCM service
│       └── config/         # Firebase Admin config
│
├── public/                 # Static assets, PWA manifest
├── firebase.json           # Firebase hosting config
└── vite.config.js          # Vite + PWA configuration
```

---

## 🚀 Deployment

| Component | Platform |
|-----------|----------|
| **Frontend** | Firebase Hosting |
| **Backend** | Cloud server (Railway/Render/VPS) |
| **Database** | Firebase Realtime Database |

---

## 📱 PWA Capabilities

✅ **Installable** on mobile home screen  
✅ **Offline access** to cached pages  
✅ **Push notifications** even when closed  
✅ **App-like experience** with no browser chrome  
