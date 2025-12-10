# Technology Stack & Dependencies

This document details the complete technology stack used to build the ATLAS application, including frontend frameworks, backend services, libraries, and development tools.

## Frontend Core
- **React 19**: The latest version of the React library for building user interfaces. Utilizes the new React Compiler (potentially) and enhanced concurrent features.
    - *Usage*: Core UI component library.
- **Vite 7**: Next-generation frontend tooling. Provides extremely fast HMR (Hot Module Replacement) and optimized production builds.
    - *Usage*: Build tool, dev server, and bundler.
- **JavaScript (ES Modules)**: The application is built using modern JavaScript with ES Module syntax (`import`/`export`).

## Styling & Design
- **Tailwind CSS 3.4**: A utility-first CSS framework for rapid UI development.
    - *Usage*: Primary styling engine. Handles layout, spacing, typography, and colors directly in JSX.
- **Framer Motion 12**: A production-ready motion library for React.
    - *Usage*: Complex animations, page transitions, and the "Hero Geometric" login animation.
- **Lucide React**: Text-based icon set.
    - *Usage*: Provides clean, consistent Svg icons for the UI (Sidebar, Actions).
- **Headless UI**: Unstyled, fully accessible UI components.
    - *Usage*: Used for complex interactive components like dropdowns/menus (`Listbox`, `Menu`) to ensure accessibility.
- **PostCSS / Autoprefixer**: Tooling to transform CSS with JavaScript. Ensures cross-browser compatibility.

## State Management & Logic
- **React Context API**: Native state management.
    - *Usage*: Managing Authentication state (`AuthContext`), Theme state, and global user data.
- **React Router DOM 7**: Declarative routing for React.
    - *Usage*: Handles client-side navigation between Login, MD Dashboard, Employee Dashboard, etc.
- **Date-fns 4**: Modern JavaScript date utility library.
    - *Usage*: Date manipulation, formatting (e.g., "Do MMM YYYY"), and comparison logic for attendance/leave.

## Backend & Services
- **Firebase**: Backend-as-a-Service (BaaS) platform by Google.
    - **Authentication**: Google Sign-In provider.
    - **Realtime Database (RTDB) / Firestore**: Real-time NoSQL database for syncing attendance and user data instantly.
    - **Cloud Messaging (FCM)**: Push notification delivery service.
    - **Hosting**: Hosting provider for the frontend assets.
- **Node.js**: JavaScript runtime for the backend server.
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
    - *Usage*: Backend API server and Cron job host.
- **Firebase Admin SDK**: Server-side library for privileged Firebase access.
    - *Usage*: Sending push notifications, verifying tokens, and admin-level database operations.

## Features & Utilities
- **Vite PWA Plugin**: Zero-config PWA framework for Vite.
    - *Usage*: Generates Service Workers and Web Manifests to make the app installable and offline-capable.
- **ExcelJS / XLSX / File-Saver**: Libraries for handling spreadsheet data.
    - *Usage*: Generating and downloading detailed Excel reports for MDs.
- **Node Cron**: Task scheduler for Node.js.
    - *Usage*: Scheduling the 10:00 AM and 5:00 PM attendance reminders.

## Development & Code Quality
- **ESLint 9**: Pluggable JavaScript linter.
    - *Usage*: Enforcing code quality, finding syntax errors, and maintaining consistent coding style.
- **Prettier**: (Implied) Code formatter.
- **Vite Plugin React**: Official React plugin for Vite, enabling Fast Refresh.
