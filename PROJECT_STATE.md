# Project State: File Structure and Purpose

This document provides a comprehensive list of all files in the project and their specific purposes.

## Root Directory (`g:\ATLAS\atlas-app`)

- **`.env`**: Contains environment variables for the application, such as Firebase configuration keys and API endpoints. Critical for security and configuration management.
- **`.env.example`**: A template for the `.env` file, listing required environment variables without their actual secrets. Used for setting up new environments.
- **`.firebaserc`**: Stores the Firebase project alias configurations, linking the local project to the Firebase console project.
- **`firebase.json`**: The central configuration file for Firebase Hosting, Functions, and other services. Defines public directories, rewrites for SPA (Single Page Application) routing, and deployment targets.
- **`package.json`**: The project manifest. Lists all dependencies (React, Vite, Firebase, etc.), scripts (dev, build, lint), and metadata (name, version).
- **`package-lock.json`**: Automatically generated file that locks dependency versions to ensure consistent installs across different environments.
- **`vite.config.js`**: Configuration file for Vite. Handles plugin setup (React, PWA), build optimizations, path resolution, and server settings.
- **`tailwind.config.js`**: Configuration for Tailwind CSS. Defines the content sources to scan for class names, custom theme extensions (colors, fonts), and plugins.
- **`postcss.config.js`**: Configures PostCSS, primarily to load Tailwind CSS and Autoprefixer.
- **`index.html`**: The main entry point for the web application. Contains the root DOM element (`#root`) where React mounts the app.
- **`EMAIL-CONFIG-GUIDE.md`**: Documentation explaining how to configure MD and Employee emails using role-based text files in the `public/config` directory.
- **`process_logo.py`**: A Python script likely used for generating or resizing the application logo assets.
- **`build_log.txt` / `build_output.txt`**: Logs from previous build processes, useful for debugging build failures.

## Source Directory (`src`)

- **`main.jsx`**: The React application entry point. Imports global styles, configures the Strict Mode, and renders the `App` component into the DOM.
- **`App.jsx`**: The root component. Sets up the application router (`react-router-dom`), defines routes for Login, Employee, and MD sections, and initializes global context providers (like Auth).
- **`index.css`**: Global CSS styles. Imports Tailwind directives (`@tailwind base`, etc.) and defines global theme variables and utility classes.

### Config (`src/config`)
- **`mdAllowList.js`**: Contains the logic or list of email addresses authorized for MD access. Used for role verification during login.
- **`roleConfig.js`**: Defines role constants (e.g., `ROLE_MD`, `ROLE_EMPLOYEE`) to avoid hardcoded strings throughout the app.

### Context (`src/context`)
- **`AuthContext.jsx`**: (Implied) Manages authentication state (current user, loading status) using Firebase Auth and provides it to the rest of the app via Context API.

### Components (`src/components`)
- **`DataTable.jsx`**: A reusable component for rendering data in a table format with features like sorting and pagination. Used in MD History and Employee lists.
- **`ErrorDialog.jsx`**: A modal component for displaying error messages to the user.
- **`SuccessAlert.jsx`**: A toast or alert component for showing success messages (e.g., "Attendance Marked Successfully").
- **`Layout.jsx`**: Defines the common layout structure (Sidebar + Main Content Area) for the dashboard pages.
- **`Navbar.jsx`**: Top navigation bar component, likely containing the user profile menu and mobile menu toggle.
- **`sidebar/`**: Directory containing sidebar-related components.
- **`Logo.jsx`**: Renders the application logo.
- **`ProtectedRoute.jsx`**: A wrapper component for routes that requires authentication. Redirects unauthenticated users to Login.
- **`ThemeSelector.jsx` / `ThemeToggle.jsx`**: Components for switching between light/dark modes or different color themes.
- **`ui/`**: Directory for primitive UI components (buttons, inputs) if separated.

### Pages: Employee (`src/pages/Employee`)
- **`Home.jsx`**: The main dashboard for employees. Shows today's status, quick actions (Mark Attendance), and a summary of recent activity.
- **`History.jsx`**: detailed view of the employee's attendance history, showing dates, status (Present/Absent/Leave), and check-in/out times.
- **`Leave.jsx`**: Page for employees to apply for leave. Includes a form for dates and reason.
- **`Profile.jsx`**: Employee profile settings. Allows viewing and editing personal details (Name, generic info).

### Pages: MD (`src/pages/MD`)
- **`Dashboard.jsx`**: High-level overview for MDs. Shows attendance stats, pending approvals count, and quick insights.
- **`Approvals.jsx`**: Manages attendance correction requests. Lists pending requests with functionalities to Approve or Reject.
- **`Profiles.jsx`**: A list of all employees. Clicking a comprehensive view of their attendance and stats.
- **`ProfileDetail.jsx`**: The detailed view for a specific employee, accessible from `Profiles.jsx`. Shows their full history and stats.
- **`EmployeeManagement.jsx`**: Interface for managing employee accounts (add/remove/update roles, potentially).
- **`Export.jsx`**: Functionality to export attendance data to Excel/CSV.

### Server (`server`)
- **`index.js`**: The main Node.js/Express server file.
    - **Firebase Admin Init**: Initializes the Firebase Admin SDK for server-side operations.
    - **Cron Jobs**: Schedules automated tasks (Morning Reminder at 10 AM IST, Evening Reminder at 5 PM IST).
    - **API Routes**:
        - `/`: Health check.
        - `/api/trigger-reminder`: Manually triggers reminders for testing.
        - `/api/send-test`: Sends a test push notification.
        - `/api/pending-employees`: Returns a list of employees who haven't marked attendance yet.
    - **Push Logic**: Contains `sendPushNotification` helper to send FCM messages.

### Public Directory (`public`)
- Contains static assets served directly.
- **`config/md-emails.txt`**: Plain text list of MD emails.
- **`config/employee-emails.txt`**: Plain text list of Employee emails.
