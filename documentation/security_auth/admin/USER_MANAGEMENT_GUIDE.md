# Admin Guide: User Management

## 1. Creating New Employees
1.  Navigate to the Admin Dashboard (Frontend).
2.  Click "Add Employee".
3.  Enter **Official Email** and **Full Name**.
4.  Select Role:
    *   **Employee**: Standard access.
    *   **MD**: Full Admin access (Use carefully).
5.  Click Create. The user will receive an email (handled by Firebase) or you can set a temporary password.

## 2. Managing Access (Suspension)
If an employee is terminated or a device is lost:
1.  Go to User List.
2.  Click "Suspend" next to their name.
3.  **Effect**:
    *   They are logged out **immediately** (sessions killed).
    *   They cannot log in again until reactivated.
    *   API access is blocked instantly (even if they have a token).

## 3. Changing Roles
1.  Go to User Profile.
2.  Select new Role.
3.  **Effect**:
    *   If promoted: immediate access to new features.
    *   If demoted: immediate loss of admin privileges.

## 4. Archiving Users
*   Use "Archive" for former employees.
*   Keeps data/history but disables login permanently.
