# Technical Concepts & Architectural Decisions

This document details the underlying technical concepts, design patterns, and architectural decisions that drive the ATLAS application.

## 1. Architectural Patterns
- **Single Page Application (SPA)**: The frontend is a true SPA where the browser loads a single HTML document and updates the content via JavaScript APIs. This ensures smooth transitions and an "app-like" feel without full page reloads.
- **Separation of Concerns**:
    - **Frontend**: Handles UI, User Interaction, and State Management.
    - **Backend (Server)**: Handles Scheduled Tasks (Cron), Push Notifications, and Heavy Logic.
    - **Database**: Serves as the single source of truth for data sync.
- **Mobile-First Design**: The UI is designed primarily for mobile devices (due to the on-the-go nature of attendance) and scales up to desktop views via responsive breakpoints.
- **Progressive Web App (PWA)**:
    - **Service Workers**: Used to cache assets and enable offset functionality.
    - **Manifest**: Defines app behavior (display mode, orientation, icons) for valid installation on devices.
    - **App Shell Model**: The shell (UI structure) loads first, then content fills in.

## 2. React Patterns & Concepts
- **Component-Based Architecture**: UI is broken down into small, reusable pieces (`Button`, `Card`, `Navbar`).
- **Hooks Pattern**:
    - **Custom Hooks**: Encapsulation of logic (e.g., `useAuth` for accessing user state anywhere).
    - **Effect Hooks (`useEffect`)**: Handling side effects like data fetching, subscriptions, and DOM manipulation.
    - **State Hooks (`useState`, `useReducer`)**: Local state management.
- **Context API**: Dependency Injection mechanism to pass global data (Auth, Theme) deeply through the component tree without prop drilling.
- **Protected Routes**: A Higher-Order Component (HOC) pattern (wrapper) that checks authentication logic before rendering sensitive child routes.
- **Declarative UI**: Describing *what* the UI should look like based on state, rather than *how* to change it iteratively.

## 3. Data & State Management
- **Real-Time Synchronization**: Leveraging Firebase Realtime Database/Firestore listeners. When data changes on the server, the client UI updates instantly without manual refreshing (Optimistic UI).
- **Asynchronous JavaScript**: Extensive use of `async/await` for non-blocking database operations and API calls.
- **Optimistic Updates**: (In some flows) UI updates immediately while the server request processes in the background to improve perceived speed.

## 4. Backend & Infrastructure Concepts
- **Server-Side Cron Jobs**: Scheduling tasks (reminders) to run at specific times independently of user activity.
- **Timezone Management**: Critical handling of server time vs. user time. Explicit conversion to **IST (Indian Standard Time)** for all business logic to ensure consistency regardless of server location (e.g., Render servers in UTC).
- **Stateless REST API**: The Node.js server exposes stateless endpoints where every request contains all necessary info (Tokens) to handle it.
- **Cross-Origin Resource Sharing (CORS)**: Security mechanism configured on the backend to allow requests only from the trusted frontend domain.

## 5. Security Concepts
- **Environment Variables**: Storing sensitive configuration (API Keys, Service Account Private Keys) in `.env` files, which are injected at build time (Frontend) or runtime (Backend). **Never hardcoded.**
- **Least Privilege**: Firebase configuration uses roles (MD vs Employee) to restrict access. (Future: Database Rules should enforce this at the data level).
- **Token-Based Authentication**: Using secure tokens (JWTs from Google Auth) to verify identity.

## 6. CSS & Styling Concepts
- **Utility-First CSS**: Using Tailwind CSS to compose designs directly in markup. Reduces the need for custom CSS files and prevents style conflicts.
- **Design Tokens**: Defining colors, fonts, and spacing in a centralized config (`tailwind.config.js`) to ensure consistency.
- **CSS Variables (Custom Properties)**: Used for dynamic theming (Dark/Light mode switch) where values change based on the body class.
- **Glassmorphism**: A UI trend relying on transparency (backdrop-filter), blur, and light borders to mimic frosted glass.

## 7. Build & Deployment
- **Tree Shaking**: Vite removes unused code during the build process to minimize bundle size.
- **Minification**: Compressing JavaScript and CSS files for faster load times.
- **Hot Module Replacement (HMR)**: Updating modules in the browser during development without a full reload, preserving application state.
- **Static Asset Handling**: Managing images and icons via the `public` folder vs `src/assets` (importing).
