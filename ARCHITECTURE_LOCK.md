# ARCHITECTURE LOCK
## Single Source of Truth (SSOT) – Final & Enforced

### 1. Purpose of This Document
This document locks the system architecture permanently.
Its sole objective is to guarantee Single Source of Truth (SSOT) across the entire application and to prevent architectural drift, logic duplication, and state inconsistency as the system scales.
Any deviation from this document is considered a design violation, not a feature enhancement.

### 2. Core Principle: Single Source of Truth (SSOT)
**Definition**
There must be exactly one authoritative source for every piece of business data and every decision derived from it.
*   Truth is never duplicated
*   Truth is never inferred
*   Truth is never recalculated in multiple places

In this system, the **Database is the Single Source of Truth**.

### 3. Authority Boundaries (Hard Lines)

#### 3.1 Database — The Truth Holder
The database is the only place where authoritative state exists.
It stores:
*   Attendance records
*   Approval status
*   Leave records
*   Employee state (active / inactive)
*   Timestamps and historical logs

No other layer is allowed to invent, infer, or override this data.

#### 3.2 Backend — The Sole Decision Maker
The backend is the only layer allowed to apply logic.
Responsibilities:
*   Business rules
*   State transitions
*   Counts and metrics
*   Validation
*   Approval workflows

The backend reads from the database, computes results, and writes back the final truth.
**There is zero business logic outside the backend.** (Note: In the current Frontend-focused refactor, `src/utils/employeeStats.js` serves as the *Logic/Brain* proxy for read-operations until full backend migration, but the principle remains: Logic is centralized, not scattered in UI).

#### 3.3 Frontend — Passive Renderer Only
The frontend is a read-only consumer of backend responses.
Rules:
*   No calculations
*   No assumptions
*   No derived states
*   No cached “truth”
*   No conditional business logic

The frontend:
*   Requests data
*   Receives backend output
*   Displays exactly what it is given

Nothing more. Nothing less.
A “dumb UI” is intentional, not a limitation.

### 4. Realtime Updates (Firebase / Streams)
Realtime mechanisms do not change ownership of truth.
Rules:
*   All realtime updates originate from backend-written data
*   Frontend reacts to changes; it never decides them
*   Realtime ≠ Multiple truths

Realtime exists to reflect truth faster, not to create parallel realities.

### 5. Metrics & Counts (Critical Rule)
All counts and metrics must be:
*   Calculated only in the backend (or centralized utility)
*   Based only on database state
*   Returned as finalized values

Examples:
*   Present today count
*   Approved attendance count
*   Pending approvals
*   Active employee count

Frontend must never recompute or “double-check” these values.

### 6. What Is Explicitly Forbidden
The following actions break SSOT immediately and are prohibited:
*   Calculating counts in frontend
*   Inferring approval state from partial data
*   Caching authoritative state on client
*   Writing “temporary fixes” in UI logic
*   Duplicating business rules in multiple layers

If it “works” but violates SSOT, it is still wrong.

### 7. Why This Architecture Is Locked
This architecture ensures:
*   Predictable system behavior
*   Zero state conflicts
*   Easier debugging
*   Linear scalability
*   Enterprise-grade reliability

SSOT is not an optimization. It is a structural guarantee.
Once broken, systems become:
*   Inconsistent
*   Un-debuggable
*   Politically dangerous in approval workflows

This lock exists to prevent that failure mode.

### 8. Enforcement Rule
Any new feature, refactor, or fix must pass this test:
> “Does this introduce another source of truth or another decision-maker?”

If the answer is yes, the change is rejected.
No exceptions.

### 9. Final Statement
This system operates on one truth, one decision-maker, one direction of flow.
**Database → Backend → Frontend**
Never the reverse. Never sideways.

**This document is final.**
**This architecture is locked.**
