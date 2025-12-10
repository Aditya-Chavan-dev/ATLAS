# Project History: Issues Faced & Solutions

This document records the significant technical challenges, bugs, and roadblocks encountered during the development of ATLAS, along with their solutions.

## 1. Security & Configuration
### 🔴 Issue: Exposed API Secrets
- **Problem**: Sensitive Firebase API keys and service account credentials were explicitly hardcoded in the codebase and committed to the repository, posing a security risk.
- **Solution**:
    - Removed hardcoded keys from all files.
    - Implemented `.env` file strategy (using `VITE_` prefix for frontend).
    - Added `.env` to `.gitignore`.
    - Setup build-time injection for secrets.
    - Advised user on key rotation.

### 🔴 Issue: PWA Icon & Cache
- **Problem**: The PWA (Progressive Web App) icon was not displaying correctly on installation, and updates to the icon ("ATLAS only .jpg") were not reflecting due to aggressive browser caching.
- **Solution**:
    - Correctly configured `vite-plugin-pwa` manifest.
    - Renamed assets to standard filenames.
    - Forced a "Hard Refresh" and cleared Service Worker cache to verify changes.

## 2. Attendance Logic & Backend
### 🔴 Issue: "No Changes Detected" Bug
- **Problem**: When an employee tried to submit an attendance correction with a new Site Name, the system incorrectly rejected it saying "No changes detected," effectively blocking valid corrections.
- **Solution**: Refined the comparison logic to correctly check *all* fields (including Site Name) against the existing record before validating the request.

### 🔴 Issue: Timezone Consistency (IST vs UTC)
- **Problem**: Server-side reminders (Cron jobs) were firing at the wrong times because the hosting environment (Render) runs in UTC, while the target users are in IST (UTC+5:30).
- **Solution**: Implemented explicit timezone offsets in the Cron schedule and date generation functions to force IST calculation regardless of server time.

### 🔴 Issue: Invalid Leave Dates
- **Problem**: Employees could select dates in the past when applying for new leave.
- **Solution**: Added validation logic in the `Leave.jsx` form to disable/reject any date prior to "Today".

## 3. User Interface (UI) & Styling
### 🔴 Issue: Login Page Visibility (Dark Mode)
- **Problem**: Text and inputs on the Login page were invisible (black-on-black) because they were using theme variables that didn't account for the specific dark background of the Login page.
- **Solution**: Decoupled Login page styles from the global theme. Hardcoded specific accessible colors for the Login component to ensure visibility in all modes.

### 🔴 Issue: Profile Page Layout Breakage
- **Problem**: The User Profile page looked fine on mobile but completely broke on Desktop (stretched elements, bad alignment) due to missing max-width constraints and incorrect Grid usage.
- **Solution**: Refactored the layout using a "Mobile-First" approach. Added a container (max-width) and proper CSS Grid definitions for desktop viewports.

### 🔴 Issue: Sidebar Navigation Overlap
- **Problem**: The MD Dashboard sidebar was overlapping content or behaving inconsistently on different screen sizes.
- **Solution**: Rewrote the Sidebar component to be fully responsive (collapsible drawer on mobile, fixed width on desktop) and adjusted main content margins.

## 4. Build & Deployment
### 🔴 Issue: Build Failures
- **Problem**: `npm run build` failed due to syntax errors in `MDLayout.jsx` and missing configuration files.
- **Solution**: Fixed syntax errors (missing closing braces/tags) and ensured all dependencies were correctly installed.

### 🔴 Issue: Usage Limits
- **Problem**: Frequent interruption of development due to AI agent usage limits.
- **Solution**: Optimized prompts for clarity and batched requests to maximize efficiency per session. (User requested limit increase).

## 5. Feature Implementation
### 🔴 Issue: MD Dashboard Complexity
- **Problem**: The initial MD Dashboard tried to do too much in one view, becoming cluttered and slow.
- **Solution**: Split the MD Dashboard into distinct, focused pages: **Dashboard** (Stats), **Approvals** (Tasks), and **Profiles** (Data).

### 🔴 Issue: Export Functionality
- **Problem**: MDs needed a way to get data out of the system for payroll.
- **Solution**: Integrated `xlsx` / `ExcelJS` to generate downloadable Excel sheets with custom date ranges (1, 3, 6, 12 months).
