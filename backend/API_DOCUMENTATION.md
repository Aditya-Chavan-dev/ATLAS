# ATLAS API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All endpoints (except `/health`) require Firebase ID Token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "OK",
  "message": "ATLAS Backend is running"
}
```

---

## Employee Endpoints

### Create Employee
**POST** `/employees/create`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@autoteknic.com",
  "role": "Employee",
  "department": "Engineering",
  "designation": "Software Engineer"
}
```

**Response:**
```json
{
  "id": "emp_001",
  "message": "Employee created successfully"
}
```

### Get All Employees
**GET** `/employees`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "emp_001": {
    "name": "John Doe",
    "email": "john@autoteknic.com",
    "role": "Employee",
    "stats": {
      "totalPresent": 45,
      "totalLeaves": 3
    }
  }
}
```

### Get Employee by ID
**GET** `/employees/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "name": "John Doe",
  "email": "john@autoteknic.com",
  "role": "Employee",
  "stats": {
    "totalPresent": 45,
    "totalLeaves": 3
  }
}
```

---

## Attendance Endpoints

### Mark Attendance
**POST** `/attendance/mark`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "employeeId": "emp_001",
  "type": "Office",
  "status": "Present",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully"
}
```

### Get Attendance History
**GET** `/attendance/history?employeeId=emp_001`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "2025-11-20": {
    "inTime": "2025-11-20T09:15:00.000Z",
    "type": "Office",
    "status": "Present"
  }
}
```

---

## Leave Endpoints

### Apply for Leave
**POST** `/leave/apply`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "employeeId": "emp_001",
  "startDate": "2025-11-25",
  "endDate": "2025-11-27",
  "reason": "Personal work",
  "type": "Casual Leave"
}
```

**Response:**
```json
{
  "id": "req_001",
  "message": "Leave application submitted"
}
```

### Approve/Reject Leave
**PUT** `/leave/approve/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "status": "Approved",
  "approvedBy": "md_001"
}
```

**Response:**
```json
{
  "message": "Leave request Approved"
}
```

### Get Leave Requests
**GET** `/leave`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "req_001": {
    "employeeId": "emp_001",
    "startDate": "2025-11-25",
    "endDate": "2025-11-27",
    "status": "Pending",
    "appliedAt": "2025-11-20T10:00:00.000Z"
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthorized: No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized: Invalid token"
}
```

### 404 Not Found
```json
{
  "error": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create employee"
}
```
