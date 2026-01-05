# Owner Module Documentation 🛡️

## Overview
The **Owner Module** (`src/features/owner`) provides High-Level Administration and Access Control capabilities for the ATLAS application. It is designed to be the "Control Center" where the User Identity Management (IdM) takes place.

**Primary User:** Owner (Super Admin)
**Access Route:** `/owner` (Protected via `EmailBasedRoute` guard in `App.tsx`)

## 📂 Folder Structure
The module follows a Feature-Based Architecture:
```
src/features/owner/
├── components/     # (Reserved for reusable UI widgets)
├── layouts/        # Layout wrappers
│   └── OwnerLayout.tsx  # Sidebar + Header + Auth checks
├── pages/          # Main route views
│   └── OwnerDashboard.tsx # Role Management Table
└── hooks/          # (Reserved for future logic separation)
```

## 🔐 Logic & Security
### 1. Route Protection
Access is strictly controlled in `src/App.tsx`.
*   **Current:** Hardcoded check for `adityagchavan3@gmail.com`.
*   **Future:** Will migrate to `claims.role === 'owner'` check once Custom Claims are fully implemented.

### 2. Database Integration
The module connects to the **Legacy Realtime Database** to ensure compatibility with existing data.
*   **Path:** `employees` (Root level list)
*   **Read:** Fetches top 500 users ordered by Email.
*   **Write:** Updates `role` and `status` fields directly at `employees/{uid}/profile`.

## 🛠️ Key Features
### User Access Control (`OwnerDashboard.tsx`)
*   **View All Users:** Lists everyone who has signed up via Google Auth and exists in the `employees` DB path.
*   **Role Assignment:**
    *   **Dropdown:** Assign `Employee`, `MD`, `HR`, `Owner`.
    *   **Bulk Action:** "Make Employee" (Select multiple -> Apply).
    *   **Safety Lock:** Bulk actions are **disabled** for high-privilege roles (MD/HR/Owner) to prevent accidents.

## 🎨 UI/UX References
*   **Design System:** Tailwind CSS
*   **Themes:**
    *    Sidebar: `slate-900` (Dark/Professional)
    *    Content: High-density Data Table with `indigo` accents.
*   **Icons:** Lucide React (`Shield`, `Users`, `Settings`)

## 🔄 Data Flow
1.  **Load:** `useEffect` → `firebase/database` → `get(query('employees'))`
2.  **Display:** React State (`employees`) → Mapped to Table.
3.  **Update:** `update(ref, { role: 'newRole' })` → Optimistic UI Update.
