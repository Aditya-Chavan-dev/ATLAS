# Owner Feature Module 🛡️

## 📍 Purpose
This directory contains **ALL** code related to the Owner (Super Admin) functionality. It is designed to be self-contained.

**Goal:** Provide user management and role assignment interfaces for the system owner.

## 📂 Folder Structure
*   `layouts/OwnerLayout.tsx`: The main wrapper. Handles the Sidebar and Authentication checks.
*   `pages/OwnerDashboard.tsx`: The main User Interface. Displays the user table and filter controls.
*   `hooks/useOwnerUsers.ts`: **Core Logic**. Handles connection to Firebase Realtime Database.

## 🛠️ Implementation Details

### 1. Data Fetching (`useOwnerUsers.ts`)
*   **Source:** Firebase Realtime Database (`employees` path).
*   **Logic:** Fetches the top 500 users ordered by email.
*   **Reasoning:** To prevent "data iceberg" (overfetching), we limit to 500. Legacy system had thousands of records.

### 2. Role Management logic
*   **User Roles:** `employee`, `hr`, `md`, `owner`.
*   **Safety Rule:** Bulk updates are **ONLY** allowed for the `employee` role.
    *   *Why?* Assigning `owner` or `md` role gives high privilege. This must be done intentionally, one-by-one, to prevent accidents.

### 3. Files & Dependencies
*   All styles use Tailwind CSS.
*   Icons come from `lucide-react`.
*   Routes are defined in `src/App.tsx` (Lazy loaded where possible).

## 🚀 How to Extend
To add a new feature (e.g., "Company Settings"):
1.  Create `pages/SettingsPage.tsx`.
2.  Add route in `App.tsx` under `/owner`.
3.  Add link in `OwnerLayout.tsx` navigation list.
