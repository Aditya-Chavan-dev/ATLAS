# Production-Grade RBAC System

A strict, fail-closed Role-Based Access Control system for Node.js + Firebase + PostgreSQL.

## 🚀 Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in credentials.
    ```bash
    cp .env.example .env
    ```

3.  **Database Migration**
    Create the schema and constraints.
    ```bash
    npm run migrate
    ```

4.  **Start Server**
    The server will automatically seed the `Root Owner` if missing.
    ```bash
    npm run dev
    ```

## 🔐 Architecture

-   **Authentication**: Firebase Auth (Identity)
-   **Authorization**: Local PostgreSQL (Permissions & Roles)
-   **Security**: Fail-closed middleware. "No Database Record = No Access".
-   **Audit**: Immutable, append-only logs for EVERY decision.

## 🛠️ Admin API

All endpoints require `Bearer` token.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/pending-users` | Owner | List users awaiting approval |
| `POST` | `/api/admin/users/:email/approve` | Owner | Approve pending user & assign role |
| `DELETE` | `/api/admin/users/:email/reject` | Owner | Reject pending user |
| `GET` | `/api/admin/users` | Owner | List all active users |
| `PATCH` | `/api/admin/users/:email/role` | Owner | Modify user role |
| `PATCH` | `/api/admin/users/:email/deactivate` | Owner | Suspend user access |
| `PATCH` | `/api/admin/users/:email/activate` | Owner | Restore user access |
| `POST` | `/api/admin/secondary-owner/revoke` | **Root** | Demote secondary owner |
| `GET` | `/api/admin/audit-logs` | **Root** | View security audit trail |

## 🧪 Testing

1.  **Root Owner Login**: Login with the email defined in `ROOT_OWNER_EMAIL`.
2.  **Unauthorized**: Login with any other Google account -> 403 (Pending).
3.  **Role Promotion**: Use Root Owner to approve the pending user.
4.  **Immediate Effect**: Role changes bind immediately on the next request.

## ⚠️ Security Notes

-   **Root Owner** cannot be modified via API.
-   **Audit Logs** are immutable (DB Trigger enforces this).
-   **Environment** variables are validated strictly on startup.
