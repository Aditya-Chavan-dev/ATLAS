# ATLAS Development Rules

Status: Mandatory. Not suggestions.

## How to Think Before You Code

Context matters more than syntax.

AI knows how to write a for-loop. You need to know *why* you're looping in the first place.

Before writing code, answer:
- Why are we building this?
- What breaks at 1,000 users?
- What can go wrong?

If you can't answer those, don't start coding.

---

## Your Job Is Changing

You're shifting from "writer" to "editor."

AI generates code fast. Your job is spotting:
- The security flaw hidden in "clean" code
- The performance bottleneck that looks fine in dev
- The edge case that breaks in production

If you can't review code critically, you're not useful.

---

## Pre-Coding Checklist

Stop. Think first.

**Context:**
- What user pain does this solve?
- What happens at 100 users? 1,000?
- What's the database cost?

**Security:**
- Can this be abused?
- Rate limiting needed?
- Authorization enforced (not just authentication)?

**Failure:**
- What happens when network fails?
- Race conditions?
- Concurrent requests?

**User Journey:**
- Happy path clear?
- Error feedback useful?
- Loading states obvious?

If you skip this, you'll regret it later.

---

## Code for Humans

If your teammate needs a 30-minute meeting to understand your code, it's broken.

Good code:
- Self-documenting names
- Single responsibility
- Predictable
- Testable

Bad code:
- Clever but unreadable
- God functions
- Magic values
- Deeply nested
- Uncommented complexity

---

## Production Mindset

"It works" isn't the finish line.

Production-ready means:
- Designed end-to-end (tradeoffs, scale)
- Edge cases handled before users find them
- Reliable (failures, retries, fallbacks)
- Secure by default
- Observable (logs, metrics, alerts)
- Performance matters at P95/P99

---

## SOLID Principles

### Single Responsibility

Each class has ONE reason to change.

```typescript
// Good
class AttendanceService {
  async create(data: AttendanceData) {
    // Only handles creation
  }
}

class AttendanceNotifier {
  async notifyMD(attendance: AttendanceRecord) {
    // Only handles notifications
  }
}

// Bad
class AttendanceManager {
  async create(data: AttendanceData) {
    // Creates + notifies + logs + analytics
    // Too many jobs
  }
}
```

### Open/Closed

Open for extension, closed for modification.

```typescript
interface NotificationChannel {
  send(message: string): Promise<void>;
}

class FCMNotifier implements NotificationChannel {
  async send(message: string) { /* FCM */ }
}

class EmailNotifier implements NotificationChannel {
  async send(message: string) { /* Email */ }
}

// Add new channels without modifying existing code
```

### Liskov Substitution

Subtypes must be substitutable for base types.

```typescript
interface LeaveApprover {
  approve(leaveId: string): Promise<void>;
}

class MDApprover implements LeaveApprover {
  async approve(leaveId: string) { /* MD logic */ }
}

class OwnerApprover implements LeaveApprover {
  async approve(leaveId: string) { /* Owner logic */ }
}

// Can use either without breaking
```

### Interface Segregation

Small, role-specific interfaces.

```typescript
interface Readable {
  read(id: string): Promise<AttendanceRecord>;
}

interface Writable {
  create(data: AttendanceData): Promise<AttendanceRecord>;
  update(id: string, data: Partial<AttendanceData>): Promise<void>;
}

// Implement only what you need
```

### Dependency Inversion

Depend on abstractions, not concretions.

```typescript
interface AttendanceRepository {
  create(data: AttendanceData): Promise<AttendanceRecord>;
}

class AttendanceService {
  constructor(private repository: AttendanceRepository) {}
  
  async markAttendance(data: AttendanceData) {
    return this.repository.create(data);
  }
}

// Can swap implementations (Firestore, Mock, etc.)
```

---

## Design Principles

### DRY (Don't Repeat Yourself)

```typescript
// Good
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const today = formatDate(new Date());
const yesterday = formatDate(subDays(new Date(), 1));

// Bad
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
```

Centralize logic in `src/shared/utils/`.

### KISS (Keep It Simple)

```typescript
// Good
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Bad (over-engineered)
function isWeekend(date: Date): boolean {
  const weekendDays = [0, 6];
  return weekendDays.includes(new Date(date.getTime()).getDay()) ? true : false;
}
```

### YAGNI (You Aren't Gonna Need It)

Build what you need NOW. Not what you might need later.

```typescript
// Good
interface AttendanceRecord {
  id: string;
  employee_uid: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Bad (premature features)
interface AttendanceRecord {
  // ... above fields ...
  gps_coordinates?: { lat: number; lng: number }; // Don't need yet
  photo_url?: string;                              // Don't need yet
  biometric_data?: string;                         // Don't need yet
}
```

### Composition Over Inheritance

```typescript
// Good
class AttendanceService {
  constructor(
    private notifier: Notifiable,
    private logger: Loggable
  ) {}
}

// Bad (deep inheritance)
class BaseService { /* ... */ }
class NotifiableService extends BaseService { /* ... */ }
class AttendanceService extends NotifiableService { /* ... */ }
```

---

## TypeScript Rules

### Strict Mode (No Exceptions)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### NO `any` Type

```typescript
// Good
function processData(data: AttendanceData): Promise<void> {}

// Bad
function processData(data: any): any {}

// If type is truly unknown
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}
```

### Interface Over Type (for objects)

```typescript
// Good
interface User {
  uid: string;
  email: string;
  role: 'owner' | 'md' | 'employee';
}

// Good (for unions)
type AttendanceStatus = 'pending' | 'approved' | 'rejected';
```

### Explicit Return Types

```typescript
// Good
function getUser(uid: string): Promise<User | null> {
  // ...
}

// Bad (inferred)
function getUser(uid: string) {
  // TypeScript infers, but not explicit
}
```

### NO Non-Null Assertions (!)

```typescript
// Good
const user = await getUser(uid);
if (!user) {
  throw new Error('User not found');
}
console.log(user.name);

// Bad
console.log(user!.name); // Dangerous
```

---

## React Rules

### Functional Components Only

```typescript
// Good
function MarkAttendanceForm() {
  return <div>...</div>;
}

// Bad
class MarkAttendanceForm extends React.Component {}
```

### Named Exports (NO default exports)

```typescript
// Good
export function MarkAttendanceForm() {}

// Bad
export default function MarkAttendanceForm() {}
```

### Props Interface

```typescript
interface MarkAttendanceFormProps {
  onSubmit: (data: AttendanceData) => void;
  isLoading: boolean;
}

export function MarkAttendanceForm({ onSubmit, isLoading }: MarkAttendanceFormProps) {
  // ...
}
```

### Custom Hooks for Logic

```typescript
// Extract logic to custom hook
function useAttendance(uid: string, date: string) {
  return useQuery({
    queryKey: ['attendance', uid, date],
    queryFn: () => attendanceService.getByUserAndDate(uid, date)
  });
}

function AttendancePage() {
  const { data, isLoading } = useAttendance(userId, today());
  // Component only handles UI
}
```

### NO Inline Styles

```typescript
// Good (Tailwind)
<div className="flex items-center gap-4 p-4 bg-white rounded-lg">

// Bad
<div style={{ display: 'flex', alignItems: 'center' }}>
```

---

## File Structure

```
src/
  features/
    attendance/
      components/       # React components
      hooks/            # Custom hooks
      services/         # Business logic
      types/            # TypeScript interfaces
      schemas/          # Zod validation
      index.ts          # Public API
    
  shared/
    components/         # Reusable UI
    hooks/              # Reusable hooks
    utils/              # Pure functions
    
  lib/
    firebase/           # Firebase config
```

### Naming Conventions

```typescript
// Components: PascalCase
function MarkAttendanceForm() {}

// Hooks: camelCase with 'use' prefix
function useAttendance() {}

// Services: camelCase
const attendanceService = {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Interfaces/Types: PascalCase
interface AttendanceRecord {}
```

---

## Security

### JWT Revocation

Problem: Stateless JWTs can't be revoked.

Solution: Token Version Pattern.

```typescript
interface User {
  token_version: number; // Increment on logout/password reset
}

const token = jwt.sign({
  uid: user.uid,
  token_version: user.token_version
}, SECRET);

// Validate on every request
if (decoded.token_version !== user.token_version) {
  throw new Error('Token revoked');
}

// Instant revocation
async function invalidateAllTokens(uid: string) {
  await updateUser(uid, {
    token_version: increment(1) // All tokens now invalid
  });
}
```

Increment on:
- Logout (all devices)
- Password reset
- Account disabled
- Role changed

### Input Validation (Zod)

Validate at ALL boundaries.

```typescript
import { z } from 'zod';

const AttendanceSchema = z.object({
  employee_uid: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().min(1).max(100),
  marked_at: z.string().datetime()
});

export async function markAttendance(req: Request, res: Response) {
  try {
    const data = AttendanceSchema.parse(req.body);
    await attendanceService.create(data);
    res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
  }
}
```

### Rate Limiting

If your UI can spam requests, your UI is broken.

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  keyGenerator: (req) => req.user.uid,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down. Try again in 1 minute.'
    });
  }
});

app.use('/api/v1/', limiter);
```

Frontend: Debounce inputs.

### Authorization (Not Just Authentication)

Authentication = "Who are you?"
Authorization = "Can you do this?"

```typescript
// Bad (only checks if logged in)
if (!req.user) {
  throw new Error('Unauthorized');
}

// Good (checks permission)
if (!req.user) {
  throw new Error('Unauthenticated');
}

if (req.user.role !== 'owner' && req.user.role !== 'md') {
  throw new Error('Forbidden');
}
```

### Least Privilege

Users should have minimum permissions needed.

```typescript
// Database rules
{
  "rules": {
    "attendance": {
      "$uid": {
        ".read": "auth.uid === $uid || auth.token.role === 'owner'",
        ".write": false // Only backend can write
      }
    }
  }
}
```

---

## Testing

### TDD (Test-Driven Development)

Write tests first. Then code.

```typescript
// 1. Write test
describe('AttendanceService', () => {
  it('should mark attendance', async () => {
    const data = { employee_uid: '123', date: '2026-01-13' };
    const result = await attendanceService.create(data);
    expect(result.status).toBe('pending');
  });
});

// 2. Write code to pass test
class AttendanceService {
  async create(data: AttendanceData) {
    return { ...data, status: 'pending' };
  }
}
```

### Coverage (80% Minimum)

```bash
npm run test:coverage
```

If coverage drops below 80%, CI fails.

### Test Pyramid

- 70% Unit tests (fast, isolated)
- 20% Integration tests (services + DB)
- 10% E2E tests (full user flows)

---

## Logging

### Structured Logging

```typescript
// Good
logger.info('Attendance marked', {
  employee_uid: '123',
  date: '2026-01-13',
  duration_ms: 45
});

// Bad
console.log('Attendance marked for 123 on 2026-01-13 in 45ms');
```

### Log Levels

- `error`: System failures (needs immediate attention)
- `warn`: Degraded state (needs investigation)
- `info`: Normal operations (business events)
- `debug`: Detailed diagnostics (dev only)

### Never Log Secrets

```typescript
// Bad
logger.info('User logged in', { password: user.password });

// Good
logger.info('User logged in', { uid: user.uid });
```

---

## Path Management

NO hardcoded paths.

```typescript
// Bad
import { AttendanceService } from '../../../services/attendance';

// Good (use aliases)
import { AttendanceService } from '@/services/attendance';
```

Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

That's it. Follow these or don't. But if you don't, production will teach you why you should have.
