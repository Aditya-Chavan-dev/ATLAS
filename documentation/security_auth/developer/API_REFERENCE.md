# API Reference: Authentication & Admin

## Base URL
`/api`

## Authentication
All protected endpoints require header: `Authorization: Bearer <FIREBASE_ID_TOKEN>`

---

## User Management (Admin Only - MD Role)

### Create Employee
*   **POST** `/auth/create-employee`
*   **Body**: `{ "email": "user@example.com", "name": "John Doe", "role": "EMPLOYEE", "phone": "+1234..." }`
*   **Response**: `201 Created`
*   **Security**: Admin Only. Rate Limit: 30/min.

### Suspend User
*   **POST** `/auth/suspend-employee`
*   **Body**: `{ "targetUid": "UID_123", "reason": "Security Violation" }`
*   **Response**: `200 OK`
*   **Effect**: Immediate logout, token revocation.

### Reactivate User
*   **POST** `/auth/reactivate-employee`
*   **Body**: `{ "targetUid": "UID_123" }`
*   **Response**: `200 OK`

### Archive User
*   **POST** `/auth/archive-employee`
*   **Body**: `{ "targetUid": "UID_123" }`
*   **Response**: `200 OK`
*   **Effect**: User disabled in Auth, marked 'archived' in DB.

### Change Role
*   **POST** `/auth/user-role`
*   **Body**: `{ "targetUid": "UID_123", "newRole": "MD" }`
*   **Response**: `200 OK`
*   **Effect**: Immediate permission update.

---

## Error Codes

| Code | Meaning | Action |
| :--- | :--- | :--- |
| `AUTH_TOKEN_REVOKED` | Session killed server-side | Force logout client-side |
| `AUTH_SESSION_BLOCKED` | User blacklisted | Show "Account Suspended" screen |
| `AUTH_ACCOUNT_INACTIVE`| Status != active | Show "Contact Admin" |
| `AUTH_INSUFFICIENT_ROLE`| Access denied | Show 403 Page |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Retry-After X seconds |
