# ATLAS v2: Development Rules & Standards

> **Status**: 🔒 LOCKED - Mandatory for All Code  
> **Purpose**: Complete rulebook for human developers + AI IDEs  
> **Companion**: ATLAS_FOUNDATION.md (architecture blueprint)

---

## 📋 Document Structure

This document combines:
1. **Thinking Philosophy** - How to think before coding
2. **Software Principles** - SOLID, DRY, KISS, etc.
3. **Coding Standards** - TypeScript, React, Firebase rules
4. **Security Practices** - Input validation, least privilege
5. **Testing Standards** - TDD, coverage, quality gates
6. **DevOps Practices** - Logging, deployment, monitoring
7. **AI Documentation** - Auto-generated docs on PR merge
8. **Path Management** - No hardcoded paths, use aliases

---

# Part 1: Engineering Mindset & Philosophy

## 🧠 Core Philosophy

### **Context > Syntax**
```
AI knows the syntax.
You must know the context.

Before writing code, answer:
- WHY are we building this?
- HOW does it impact the database at scale?
- HOW does it affect the user journey?
- WHAT can go wrong?
```

### **Reviewing > Writing**
```
Your job is shifting from "Writer" to "Editor."

You need the seniority to spot:
- The subtle security flaw in AI-generated code
- The performance bottleneck hidden in "clean" code
- The edge case that will break in production
```

### **Product Empathy**
```
The best engineers can:
- Talk to a customer
- Understand their pain
- Translate that into technical architecture

AI can't feel empathy.
You can.
```

---

## 📋 Pre-Coding Checklist

### **STOP. Think Before You Code.**

Before writing a single line, answer these:

#### **1. Context Questions**
- [ ] **Why are we building this?**
  - What user pain does it solve?
  - What happens if we don't build it?
  - Is this a "must-have" or "nice-to-have"?

- [ ] **How does it scale?**
  - What happens at 100 users?
  - What happens at 1,000 users?
  - What's the database impact?
  - What's the cost impact?

- [ ] **What are the tradeoffs?**
  - Speed vs. reliability?
  - Simplicity vs. flexibility?
  - Cost vs. performance?
  - Build vs. buy?

#### **2. Security Questions**
- [ ] **Can this be abused?**
  - Rate limiting needed?
  - Input validation sufficient?
  - Authorization enforced (not just authentication)?

- [ ] **What data is exposed?**
  - Are we over-fetching?
  - Sensitive fields in API response?
  - Logs contain PII?

- [ ] **Can tokens be revoked?**
  - Does logout invalidate access tokens?
  - Does password reset invalidate sessions?
  - Does account deletion clear all tokens?

#### **3. Failure Scenarios**
- [ ] **What happens when network fails?**
  - Offline support needed?
  - Retry logic?
  - User feedback?

- [ ] **What happens with concurrent requests?**
  - Race conditions?
  - Data conflicts?
  - Idempotency?

- [ ] **What happens at scale?**
  - N+1 queries?
  - Memory leaks?
  - Rate limits hit?

#### **4. User Journey**
- [ ] **Happy path**: What's the ideal flow?
- [ ] **Error path**: What feedback does user get?
- [ ] **Offline path**: Does it work without internet?
- [ ] **Loading states**: Is user informed of progress?

---

## 💬 Code for Humans

### **Rule: If your teammate can't understand without a 30-minute meeting, it's broken.**

**Good code is**:
- Self-documenting (clear names)
- Single responsibility
- Predictable (no surprises)
- Testable (mockable dependencies)
- Reviewable (small, focused changes)

**Bad code is**:
- Clever (but unreadable)
- God functions (do everything)
- Magic values (unexplained constants)
- Deeply nested (cognitive overload)
- Uncommented complexity

---

## 🚀 Production Mindset

### **"It Works" Isn't the Finish Line**

**Production-ready means**:
- ✅ Designing the system end-to-end (tradeoffs, constraints, scale)
- ✅ Breaking vague requirements into clear specs
- ✅ Choosing the right abstractions, data models, boundaries
- ✅ Thinking through edge cases before users find them
- ✅ Making it reliable: failures, retries, idempotency, fallbacks
- ✅ Security + privacy by default
- ✅ Observability: logs, metrics, tracing, alerts
- ✅ Performance + cost: what matters at P95/P99
- ✅ End: "it works" isn't the finish line

---

# Part 2: Software Engineering Principles

## 1. SOLID Principles

### **S - Single Responsibility Principle (SRP)**
**Rule**: Each class/module has ONE reason to change

```typescript
// ✅ CORRECT: Single responsibility
class AttendanceService {
  async create(data: AttendanceData): Promise<AttendanceRecord> {
    // ONLY handles attendance creation logic
  }
}

class AttendanceNotifier {
  async notifyMD(attendance: AttendanceRecord): Promise<void> {
    // ONLY handles notifications
  }
}

// ❌ WRONG: Multiple responsibilities
class AttendanceManager {
  async create(data: AttendanceData) {
    // Creates attendance + sends notification + updates analytics + logs
    // Too many responsibilities!
  }
}
```

---

### **O - Open/Closed Principle**
**Rule**: Open for extension, closed for modification

```typescript
// ✅ CORRECT: Extensible via composition
interface NotificationChannel {
  send(message: string): Promise<void>;
}

class FCMNotifier implements NotificationChannel {
  async send(message: string) { /* FCM */ }
}

class EmailNotifier implements NotificationChannel {
  async send(message: string) { /* Email */ }
}

class NotificationService {
  constructor(private channels: NotificationChannel[]) {}
  
  async notify(message: string) {
    // Can add new channels without modifying this code
    await Promise.all(this.channels.map(c => c.send(message)));
  }
}
```

---

### **L - Liskov Substitution Principle**
**Rule**: Subtypes must be substitutable for base types

```typescript
// ✅ CORRECT: Substitutable
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
function processApproval(approver: LeaveApprover, leaveId: string) {
  await approver.approve(leaveId); // Works for both
}
```

---

### **I - Interface Segregation**
**Rule**: Small, role-specific interfaces

```typescript
// ✅ CORRECT: Small interfaces
interface Readable {
  read(id: string): Promise<AttendanceRecord>;
}

interface Writable {
  create(data: AttendanceData): Promise<AttendanceRecord>;
  update(id: string, data: Partial<AttendanceData>): Promise<void>;
}

// Implement only what you need
class AttendanceRepository implements Readable, Writable {
  // No delete (attendance is immutable)
}
```

---

### **D - Dependency Inversion**
**Rule**: Depend on abstractions, not concretions

```typescript
// ✅ CORRECT: Depend on interface
interface AttendanceRepository {
  create(data: AttendanceData): Promise<AttendanceRecord>;
}

class AttendanceService {
  constructor(private repository: AttendanceRepository) {}
  
  async markAttendance(data: AttendanceData) {
    return this.repository.create(data);
  }
}

// Can swap implementations
class FirestoreRepository implements AttendanceRepository { /* ... */ }
class MockRepository implements AttendanceRepository { /* ... */ }
```

---

## 2. Design Principles

### **DRY (Don't Repeat Yourself)**

```typescript
// ✅ CORRECT: Centralized logic
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Use everywhere
const today = formatDate(new Date());
const yesterday = formatDate(subDays(new Date(), 1));

// ❌ WRONG: Duplicated logic
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
```

**ATLAS Structure**:
```
src/shared/utils/
  dateUtils.ts     → formatDate, parseDate, isWeekend
  validators.ts    → validateEmail, validateUID
  formatters.ts    → formatCurrency, formatTime
```

---

### **KISS (Keep It Simple, Stupid)**

```typescript
// ✅ CORRECT: Simple
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ❌ WRONG: Over-engineered
function isWeekend(date: Date): boolean {
  const weekendDays = [0, 6];
  return weekendDays.includes(new Date(date.getTime()).getDay()) ? true : false;
}
```

---

### **YAGNI (You Aren't Gonna Need It)**

```typescript
// ✅ CORRECT: Build what you need NOW
interface AttendanceRecord {
  id: string;
  employee_uid: string;
  date: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ❌ WRONG: Premature features
interface AttendanceRecord {
  // ... above fields ...
  gps_coordinates?: { lat: number; lng: number }; // Don't need yet
  photo_url?: string;                              // Don't need yet
  biometric_data?: string;                         // Don't need yet
}
```

---

### **Law of Demeter (Principle of Least Knowledge)**

```typescript
// ✅ CORRECT: Talk to immediate neighbors
class AttendanceService {
  constructor(private repository: AttendanceRepository) {}
  
  async getAttendance(id: string) {
    return this.repository.findById(id);
  }
}

// ❌ WRONG: Deep object chains
const name = this.props.user.profile.personalInfo.name; // Too deep
```

---

### **Composition over Inheritance**

```typescript
// ✅ CORRECT: Composition
class AttendanceService {
  constructor(
    private notifier: Notifiable,
    private logger: Loggable
  ) {}
}

// ❌ WRONG: Deep inheritance
class BaseService { /* ... */ }
class NotifiableService extends BaseService { /* ... */ }
class AttendanceService extends NotifiableService { /* ... */ }
```

---

## 3. Functional & Reactive Principles

### **Pure Functions**

```typescript
// ✅ CORRECT: Pure function (no side effects)
function calculateTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Same input = same output, no side effects
```

---

### **Immutability**

```typescript
// ✅ CORRECT: Immutable update
const updatedUser = {
  ...user,
  leave_balance: user.leave_balance - 1
};

// ❌ WRONG: Mutate original
user.leave_balance -= 1;
```

**Rule**: Use `const` everywhere, avoid `let`

---

### **Idempotency**

**Rule**: Same operation multiple times = same result

```typescript
// ✅ CORRECT: Idempotent
async function markAttendance(data: AttendanceData) {
  const existing = await getAttendance(data.employee_uid, data.date);
  
  if (existing) {
    return existing; // Already marked
  }
  
  return await createAttendance(data);
}

// Calling twice = same result (no duplicate)
```

---

### **Reactive / Event-Driven**

```typescript
// ✅ CORRECT: Event-driven (decoupled)
class AttendanceService {
  async create(data: AttendanceData) {
    const record = await this.repository.create(data);
    
    // Emit event
    this.eventBus.emit('attendance.created', record);
    
    return record;
  }
}

// Listeners (decoupled)
eventBus.on('attendance.created', (record) => notificationService.notifyMD(record));
eventBus.on('attendance.created', (record) => analyticsService.track('attendance_marked'));
```

---

# Part 3: TypeScript & Code Quality Rules

## TypeScript Rules

### **Rule 1: Strict Mode (NO EXCEPTIONS)**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

### **Rule 2: NO `any` Type**
```typescript
// ✅ CORRECT: Explicit types
function processData(data: AttendanceData): Promise<void> {}

// ❌ WRONG: any type
function processData(data: any): any {}

// ✅ CORRECT: Use unknown if type is truly unknown
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}
```

---

### **Rule 3: Interface Over Type (for objects)**
```typescript
// ✅ CORRECT: Interface for object shapes
interface User {
  uid: string;
  email: string;
  role: 'owner' | 'md' | 'employee';
}

// ✅ CORRECT: Type for unions, primitives
type AttendanceStatus = 'pending' | 'approved' | 'rejected';
```

---

### **Rule 4: Explicit Return Types**
```typescript
// ✅ CORRECT: Explicit return type
function getUser(uid: string): Promise<User | null> {
  // ...
}

// ❌ WRONG: Inferred return type
function getUser(uid: string) {
  // TypeScript infers, but not explicit
}
```

---

### **Rule 5: NO Non-Null Assertions (!)**
```typescript
// ✅ CORRECT: Handle null explicitly
const user = await getUser(uid);
if (!user) {
  throw new Error('User not found');
}
console.log(user.name); // Safe

// ❌ WRONG: Non-null assertion
console.log(user!.name); // Dangerous
```

---

## React Rules

### **Rule 1: Functional Components Only**
```typescript
// ✅ CORRECT: Functional component
function MarkAttendanceForm() {
  return <div>...</div>;
}

// ❌ WRONG: Class component
class MarkAttendanceForm extends React.Component {}
```

---

### **Rule 2: Named Exports (NO default exports)**
```typescript
// ✅ CORRECT: Named export
export function MarkAttendanceForm() {}

// ❌ WRONG: Default export
export default function MarkAttendanceForm() {}
```

---

### **Rule 3: Props Interface**
```typescript
// ✅ CORRECT: Explicit props interface
interface MarkAttendanceFormProps {
  onSubmit: (data: AttendanceData) => void;
  isLoading: boolean;
}

export function MarkAttendanceForm({ onSubmit, isLoading }: MarkAttendanceFormProps) {
  // ...
}
```

---

### **Rule 4: Custom Hooks for Logic**
```typescript
// ✅ CORRECT: Extract logic to custom hook
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

---

### **Rule 5: NO Inline Styles**
```typescript
// ✅ CORRECT: Tailwind classes
<div className="flex items-center gap-4 p-4 bg-white rounded-lg">

// ❌ WRONG: Inline styles
<div style={{ display: 'flex', alignItems: 'center' }}>
```

---

## File & Folder Structure

### **Mandatory Structure**
```
src/
  features/
    attendance/
      components/       # React components
        MarkAttendanceForm.tsx
      hooks/            # Custom React hooks
        useAttendance.ts
      services/         # Business logic
        attendanceService.ts
      types/            # TypeScript interfaces
        attendance.types.ts
      schemas/          # Zod validation
        attendance.schema.ts
      index.ts          # Public API
    
  shared/
    components/         # Reusable UI
    hooks/              # Reusable hooks
    utils/              # Pure functions
    
  lib/
    firebase/           # Firebase config
      config.ts
      firestore.ts
```

---

### **Naming Conventions**

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

// Files:
// - Components: PascalCase.tsx
// - Hooks: camelCase.ts
// - Services: camelCase.ts
// - Types: camelCase.types.ts
```

---

# Part 4: Security-First Practices

## 1. JWT Revocation Strategy

**Problem**: Stateless JWTs can't be revoked  
**Solution**: Token Version Pattern

```typescript
// User schema
interface User {
  token_version: number; // Increment on logout/password reset
}

// Embed in JWT
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

**When to increment**:
- User logs out (all devices)
- Password reset
- Account disabled
- Role changed

---

## 2. Input Validation (Zod)

**Rule**: Validate at ALL boundaries

```typescript
import { z } from 'zod';

// Define schema
const AttendanceSchema = z.object({
  employee_uid: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().min(1).max(100),
  marked_at: z.string().datetime()
});

// Validate at API boundary
export async function markAttendance(req: Request, res: Response) {
  try {
    const data = AttendanceSchema.parse(req.body);
    // data is now typed and validated
    await attendanceService.create(data);
    res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
  }
}
```

---

## 3. Rate Limiting

**Principle**: "If your UI can spam requests, your UI is broken."

```typescript
// API Layer
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

// Frontend: Debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
```

---

## 4. DTO Pattern (Prevent Over-Fetching)

**Rule**: Every API response MUST use a DTO

```typescript
// ❌ BAD: Return everything
res.json(user); // Includes password hash, tokens, internal fields

// ✅ GOOD: Transform to DTO
interface UserDTO {
  uid: string;
  name: string;
  email: string;
  role: string;
  // NO: password, tokens, fcm_token, internal fields
}

function toUserDTO(user: User): UserDTO {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

res.json(toUserDTO(user));
```

---

## 5. Principle of Least Privilege

```typescript
// Firestore Security Rules
match /attendance/{recordId} {
  // Employee: Read own only
  allow read: if request.auth.uid == resource.data.employee_uid;
  
  // MD: Read all, write approvals only
  allow read: if request.auth.token.role == 'md';
  allow update: if request.auth.token.role == 'md' 
                && request.resource.data.diff(resource.data)
                   .affectedKeys().hasOnly(['status', 'reviewed_by']);
}
```

---

## 6. Secure Error Handling

```typescript
// ✅ CORRECT: Safe error messages
try {
  await attendanceService.create(data);
} catch (error) {
  // Log internal details
  logger.error('Attendance creation failed', {
    error: error.message,
    stack: error.stack,
    user_id: req.user.uid
  });
  
  // Return safe message to user
  res.status(500).json({
    error: 'Failed to mark attendance. Please try again.'
  });
}

// ❌ WRONG: Expose internal details
catch (error) {
  res.status(500).json({
    error: error.message, // Might expose DB structure
    stack: error.stack    // Exposes code paths
  });
}
```

---

## 7. Secrets Management

```typescript
// ✅ CORRECT: Environment variables
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// ❌ WRONG: Hardcoded
const FIREBASE_API_KEY = 'AIzaSyC1234567890abcdef';
```

---

# Part 5: Testing & Quality Standards

## Testing Strategy

### **Coverage Target**: 70% (focus on critical paths)

```
Unit Tests (Vitest):
  - Services (business logic)
  - Utilities (pure functions)
  - Hooks (with React Testing Library)

Integration Tests:
  - Firebase Emulator Suite
  - API endpoints
  - Real-time listeners

E2E Tests (Playwright):
  - Mark attendance flow
  - Approval flow
  - Leave application flow
```

---

### **TDD / BDD Pattern**

```typescript
// ✅ CORRECT: Test first
describe('AttendanceService', () => {
  it('should prevent duplicate attendance', async () => {
    // Arrange
    const existingData = { employee_uid: 'user123', date: '2026-01-04' };
    await attendanceService.create(existingData);
    
    // Act & Assert
    await expect(
      attendanceService.create(existingData)
    ).rejects.toThrow('Already marked');
  });
});

// Then write implementation
```

---

### **Test Structure (AAA Pattern)**

```typescript
describe('calculateTotalDays', () => {
  it('should calculate days correctly', () => {
    // Arrange
    const startDate = '2026-01-01';
    const endDate = '2026-01-03';
    
    // Act
    const result = calculateTotalDays(startDate, endDate);
    
    // Assert
    expect(result).toBe(3);
  });
});
```

---

## Code Review Checklist

### **Review as "Editing"**

#### **Security Review**
- [ ] Can this endpoint be abused? (rate limiting?)
- [ ] Is authorization checked? (not just authentication)
- [ ] Are tokens revocable? (token_version pattern?)
- [ ] Is sensitive data exposed? (DTO used?)
- [ ] Are errors logged safely? (no PII in logs?)

#### **Scale Review**
- [ ] What happens at 1000 concurrent users?
- [ ] Is this query N+1? (denormalize if needed)
- [ ] Are we over-fetching? (DTO used?)
- [ ] Is this cached? (should it be?)
- [ ] Is rate limiting enforced?

#### **User Experience Review**
- [ ] What happens if network fails?
- [ ] What feedback does user get?
- [ ] Is loading state shown?
- [ ] Is error message helpful?
- [ ] Can user recover from error?

#### **Maintainability Review**
- [ ] Can I understand this in 6 months?
- [ ] Is naming clear? (no abbreviations)
- [ ] Is this file <200 lines?
- [ ] Are responsibilities separated?
- [ ] Is there a comment explaining WHY (not WHAT)?

---

# Part 6: DevOps & Observability

## Logging & Observability

### **Structured Logging (Winston)**

```typescript
logger.info('Attendance marked', {
  request_id: req.id,
  user_id: req.user.uid,
  location: data.location,
  duration_ms: Date.now() - startTime
});

logger.error('Attendance creation failed', {
  type: 'BUSINESS_LOGIC_ERROR',
  user_id: uid,
  error: error.message,
  request_id: req.id
});
```

---

### **Error Tracking (Sentry)**

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Automatic error capture
Sentry.captureException(error);
```

---

### **Custom Metrics**

```typescript
// Track attendance success rate
await analytics.logEvent('attendance_marked', {
  success: true,
  duration_ms: 1234
});
```

---

## Feature Flags

```typescript
// Gradual rollout
const ENABLE_BULK_APPROVAL = process.env.ENABLE_BULK_APPROVAL === 'true';

if (ENABLE_BULK_APPROVAL) {
  // New feature
} else {
  // Old behavior
}
```

---

## Infrastructure as Code

```typescript
// firebase.config.ts
export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /attendance/{recordId} {
      allow read: if request.auth.uid == resource.data.employee_uid;
    }
  }
}
`;

// Deploy via CLI
// firebase deploy --only firestore:rules
```

---

# Part 7: Forbidden Patterns

## NEVER Use

```typescript
// ❌ any type
function process(data: any) {}

// ❌ Non-null assertion
user!.name

// ❌ @ts-ignore or @ts-expect-error
// @ts-ignore
const x = y;

// ❌ var keyword
var x = 10;

// ❌ == or != (use === and !==)
if (x == y) {}

// ❌ Inline event handlers
<button onClick={() => console.log('clicked')}>

// ❌ Magic numbers/strings
if (status === 'A') {} // What is 'A'?

// ❌ Nested ternaries
const x = a ? b ? c : d : e;

// ❌ console.log in production code
console.log('Debug:', data); // Use proper logging

// ❌ Deep object chains
this.props.user.profile.personalInfo.name

// ❌ Mutations
user.leave_balance -= 1;

// ❌ God functions
function doEverything() { /* 500 lines */ }
```

---

# Part 8: Pre-Commit & CI/CD

## Pre-Commit Checklist

**Before every commit**:
- [ ] ESLint passes (no errors)
- [ ] TypeScript compiles (no errors)
- [ ] Prettier formatted
- [ ] No `console.log` statements
- [ ] No `any` types
- [ ] All functions have return types
- [ ] Tests pass (if applicable)

---

## Husky Pre-Commit Hook

```json
// .husky/pre-commit
#!/bin/sh
npm run lint
npm run type-check
npm run test
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
      - name: Check coverage
        run: |
          if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 70 ]; then
            echo "Coverage below 70%"
            exit 1
          fi
```

---

# Summary: The ATLAS Way

## Before You Code
1. ✅ Answer the "Thinking Checklist"
2. ✅ Design on paper first
3. ✅ Discuss tradeoffs with team
4. ✅ Get feedback on approach

## While You Code
1. ✅ Follow SOLID principles
2. ✅ Keep it DRY, KISS, YAGNI
3. ✅ TypeScript strict mode (no `any`)
4. ✅ Validate input (Zod)
5. ✅ Use DTOs for responses
6. ✅ Implement rate limiting
7. ✅ Add JWT revocation
8. ✅ Write pure, immutable, idempotent code

## After You Code
1. ✅ Review as an "Editor" (security, scale, UX)
2. ✅ Test (unit, integration, E2E)
3. ✅ Add observability (logs, metrics)
4. ✅ Document WHY (not WHAT)
5. ✅ Run pre-commit checks

- 🧠 **Context > Syntax**
- 🔍 **Reviewing > Writing**
- ❤️ **Product Empathy**
- 📚 **Fundamentals Matter**
- 🔐 **Security First**
- 📐 **Build for 100, Scale to 1000**
- 💬 **Code for Humans**
- ✅ **Production-Ready, Not Just "Works"**

---

# Part 7: AI Documentation Workflow

## Automated Documentation on PR Merge

**Principle**: Every merged PR automatically generates two types of documentation

### **1. Human-Readable Updates**

**Audience**: Product, Sales, Support teams

**Format**:
```markdown
# What Changed (Jan 4, 2026)

## New Feature: Bulk Approval
MDs can now approve multiple attendance records at once, saving time when reviewing daily attendance. The feature is accessible via the "Approve Selected" button on the approval page.

## User-Facing Changes
- New "Select All" checkbox in approval list
- New "Approve Selected" button (green)
- New "Reject Selected" button (red, requires reason)
- Improved performance: 80% faster when approving 10+ records

## Bug Fixes
- Fixed: Attendance not syncing when offline
- Fixed: Notification sound not playing on iOS

## Known Issues
- None
```

**Generated from**: Git commit messages + PR description + code changes

---

### **2. Technical Summaries**

**Audience**: Engineers

**Format**:
```markdown
# Technical Summary: Bulk Approval (PR #42)

## Changes
- Added `BulkApprovalActions.tsx` component
- Updated `ApprovalService.ts` with `approveMultiple()` method
- Added Firestore batch write for atomic updates
- Added unit tests (12 new tests, coverage: 85%)

## API Changes
- New endpoint: `POST /api/v1/attendance/bulk-approve`
- Request: `{ attendance_ids: string[], reviewed_by: string }`
- Response: `{ approved: number, failed: number, errors: [] }`

## Database Changes
- No schema changes
- Uses Firestore batch writes (max 500 per batch)

## Breaking Changes
- None

## Migration Required
- None

## Performance Impact
- Reduced API calls: N requests → 1 batch request
- Estimated improvement: 80% faster for 10+ approvals

## Testing
- Unit: 12 new tests
- Integration: 3 new tests
- E2E: 1 new test (bulk approval flow)

## Rollout Plan
- Feature flag: `ENABLE_BULK_APPROVAL` (default: true)
- Gradual rollout: 10% → 50% → 100% over 3 days
- Rollback: Set feature flag to false
```

**Generated from**: Code diff + PR metadata + test results

---

### **Implementation**

**GitHub Actions Workflow**:
```yaml
# .github/workflows/auto-docs.yml
name: Auto Documentation

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  generate-docs:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Human-Readable Docs
        run: |
          node scripts/generate-human-docs.js \
            --pr-number ${{ github.event.pull_request.number }} \
            --output docs/updates/$(date +%Y-%m-%d).md
      
      - name: Generate Technical Summary
        run: |
          node scripts/generate-tech-summary.js \
            --pr-number ${{ github.event.pull_request.number }} \
            --output docs/technical/PR-${{ github.event.pull_request.number }}.md
      
      - name: Commit Docs
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/
          git commit -m "docs: Auto-generated from PR #${{ github.event.pull_request.number }}"
          git push
```

---

### **Documentation Structure**

```
docs/
  updates/              # Human-readable (for non-tech teams)
    2026-01-04.md       # Daily updates
    2026-01-05.md
    
  technical/            # Technical summaries (for engineers)
    PR-42.md            # Per-PR technical details
    PR-43.md
    
  api/                  # API documentation
    v1/
      attendance.md     # Auto-generated from code
      leaves.md
```

---

### **AI Prompt for Documentation**

**Human-Readable**:
```
Given this PR:
- Title: {pr_title}
- Description: {pr_description}
- Files changed: {files}
- Commits: {commits}

Generate a non-technical summary in this format:

## New Feature: {feature_name}
{Brief description in plain English - what it does and why it's useful}

## User-Facing Changes
- {List of visible changes users will see}
- {Include UI changes, new buttons, new flows}
- {Performance improvements if significant}

## Bug Fixes
- {List of bugs fixed}

## Known Issues
- {List of known issues or "None"}

Format: Markdown, max 200 words, no code, no technical jargon.
Focus on WHAT changed and HOW users benefit.
```

**Technical Summary**:
```
Given this PR:
- Diff: {code_diff}
- Tests: {test_results}
- Coverage: {coverage_delta}

Generate a technical summary including:
1. Code changes (files, functions, classes)
2. API changes (new endpoints, breaking changes)
3. Database changes (schema, migrations)
4. Performance impact (benchmarks if available)
5. Testing (new tests, coverage)
6. Rollout plan (feature flags, gradual rollout)

Format: Markdown, include code snippets.
```

---

## Benefits

**For Non-Technical Teams**:
- ✅ Understand what's shipping without reading code
- ✅ Communicate changes to customers
- ✅ Update support documentation
- ✅ Track product roadmap progress

**For Engineers**:
- ✅ Onboard new team members faster
- ✅ Understand historical context
- ✅ Review implementation details
- ✅ Track breaking changes

**For Everyone**:
- ✅ No manual documentation work
- ✅ Always up-to-date
- ✅ Searchable history
- ✅ Consistent format

---

# Part 8: Path Management (No Hardcoded Paths)

## Problem: Hardcoded Paths Break on Refactor

```typescript
// ❌ WRONG: Hardcoded paths
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { formatDate } from '../../../shared/utils/dateUtils';

// If you move the file, all imports break!
```

---

## Solution: Path Aliases

### **1. Configure TypeScript Path Aliases**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

---

### **2. Configure Vite Path Aliases**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  }
});
```

---

### **3. Use Path Aliases Everywhere**

```typescript
// ✅ CORRECT: Path aliases
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/utils/dateUtils';
import { AttendanceService } from '@/features/attendance/services/attendanceService';
import { db } from '@/lib/firebase/config';

// Benefits:
// 1. No relative paths (../../../)
// 2. Move files freely without breaking imports
// 3. Clear where each import comes from
// 4. Autocomplete works better
```

---

### **4. Path Alias Rules**

**Rule 1**: NEVER use relative paths for cross-feature imports

```typescript
// ❌ WRONG: Relative path across features
import { LeaveService } from '../../leave/services/leaveService';

// ✅ CORRECT: Path alias
import { LeaveService } from '@/features/leave/services/leaveService';
```

**Rule 2**: Relative paths OK within same feature

```typescript
// ✅ OK: Within same feature
// File: src/features/attendance/components/MarkAttendanceForm.tsx
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceService } from '../services/attendanceService';

// ✅ ALSO OK: Path alias (more explicit)
import { useAttendance } from '@/features/attendance/hooks/useAttendance';
```

**Rule 3**: Always use aliases for shared code

```typescript
// ✅ CORRECT: Shared code via alias
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/utils/dateUtils';
```

---

### **5. Feature-Based Structure (Mandatory)**

```
src/
  features/
    attendance/
      components/
        MarkAttendanceForm.tsx
        AttendanceHistory.tsx
      hooks/
        useAttendance.ts
        useAttendanceHistory.ts
      services/
        attendanceService.ts
      types/
        attendance.types.ts
      schemas/
        attendance.schema.ts
      index.ts              # Barrel export
    
    approval/
      components/
        ApprovalList.tsx
        BulkApprovalActions.tsx
      hooks/
        usePendingApprovals.ts
      services/
        approvalService.ts
      index.ts
    
    leave/
      components/
        LeaveApplicationForm.tsx
        LeaveHistory.tsx
      hooks/
        useLeaves.ts
      services/
        leaveService.ts
      index.ts
  
  shared/
    components/
      Button.tsx
      Input.tsx
      Modal.tsx
    hooks/
      useAuth.ts
      useNotifications.ts
    utils/
      dateUtils.ts
      validators.ts
  
  lib/
    firebase/
      config.ts
      firestore.ts
      auth.ts
```

**Benefit**: Everything related to "Attendance" is in one place

---

### **6. Barrel Exports (index.ts)**

**Purpose**: Clean public API for each feature

```typescript
// src/features/attendance/index.ts
export { MarkAttendanceForm } from './components/MarkAttendanceForm';
export { AttendanceHistory } from './components/AttendanceHistory';
export { useAttendance } from './hooks/useAttendance';
export { attendanceService } from './services/attendanceService';
export type { AttendanceRecord, AttendanceData } from './types/attendance.types';

// Usage from other features
import { 
  MarkAttendanceForm, 
  useAttendance,
  type AttendanceRecord 
} from '@/features/attendance';

// Instead of
import { MarkAttendanceForm } from '@/features/attendance/components/MarkAttendanceForm';
import { useAttendance } from '@/features/attendance/hooks/useAttendance';
```

---

### **7. ESLint Rule: Enforce Path Aliases**

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["../**/shared/*", "../../**/shared/*", "../../../**/shared/*"],
          "message": "Use @/shared/* path alias instead of relative paths"
        },
        {
          "group": ["../**/features/*", "../../**/features/*"],
          "message": "Use @/features/* path alias instead of relative paths"
        }
      ]
    }]
  }
}
```

---

## Summary: Path Management

**Rules**:
1. ✅ Configure path aliases in `tsconfig.json` and `vite.config.ts`
2. ✅ Use `@/` prefix for all aliases
3. ✅ NEVER use relative paths for cross-feature imports
4. ✅ Use barrel exports (`index.ts`) for clean APIs
5. ✅ Feature-based structure (everything in one place)
6. ✅ Enforce with ESLint rules

**Benefits**:
- ✅ Move files without breaking imports
- ✅ Clear import sources
- ✅ Better autocomplete
- ✅ Easier refactoring
- ✅ Consistent codebase

---

**Status**: 🔒 LOCKED - This is the complete rulebook for ATLAS v2 development
