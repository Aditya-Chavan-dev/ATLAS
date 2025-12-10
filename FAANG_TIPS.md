# Thinking Like a FAANG Engineer: System Design & Best Practices

This document outlines high-level engineering principles and "tips & tricks" used by top-tier tech companies (FAANG), tailored to help you elevate the ATLAS project and your future work.

## 1. Scale & Performance (The "It Works, but will it Crush?" Mindset)
- **N+1 Problem**: Always be wary of loops that trigger database queries.
    - *FAANG Tip*: Fetch all required data in one go (batching) or use keys/ids to look up data in constant time O(1) rather than iterating O(n).
- **Caching is King**: The fastest request is the one you don't make.
    - *Apply this*: We used Service Workers (PWA) to cache static assets. For data, consider implementing "Stale-While-Revalidate" (SWR) patterns so users see old data instantly while new data fetches in the background.
- **Lazy Loading**: Don't load what the user doesn't see.
    - *Apply this*: ATLAS uses React.lazy() or dynamic imports for routes. If a user never visits the "Profile" page, they should never download its code.

## 2. Reliability & Fault Tolerance (Expecting Failure)
- **Graceful Degradation**: If the backend fails, the app shouldn't crash white.
    - *FAANG Tip*: Always wrap critical flows in Error Boundaries. Show a "Retry" button instead of a blank screen.
- **Idempotency**: If a user clicks "Submit" 10 times because the internet is slow, the server should process it only once.
    - *Apply this*: In `markAttendance`, ensure that a second request for the same date/user doesn't create a duplicate record or corrupt data. Use unique IDs (like `date_userid`) as keys.
- **Retry Logic (Exponential Backoff)**: Network requests fail.
    - *FAANG Tip*: Don't just fail immediately. Retry usage 1s, then 2s, then 4s... giving the network time to recover.

## 3. Data Consistency & Architecture
- **Single Source of Truth**: Never store the same data in two places unless you have a robust sync mechanism.
    - *Apply this*: The `users` collection in Firebase is the master. Local state (`useState`) should only be a temporary reflection of it.
- **Eventual Consistency**: Real-time systems (like Firebase) mean not everyone sees the same thing at the exact same millisecond. Design your UI to handle "loading" or "syncing" states gracefully.
- **Backend for Frontend (BFF)**: We moved heavy logic (Cron jobs) to the Node server. This is a classic pattern: Keep the client "dumb" (display only) and the server "smart" (business logic).

## 4. Code Quality & Maintainability
- **DRY (Don't Repeat Yourself)** vs. **WET (Write Everything Twice)**:
    - *FAANG Tip*: DRY is good, but over-abstraction is bad. It's okay to duplicate a little logic if it makes two components independent. If you couple them too tightly, changing one breaks the other.
- **Self-Documenting Code**: Comments are for "Why", not "What".
    - *Apply this*: `const isSunday = date.getDay() === 0` is better than `if (date.getDay() === 0) // check if sunday`.
- **Linting & Formatting as Law**: FAANG repos have strict CI checks. You cannot merge code if indentation is wrong. We used ESLint to mimic this.

## 5. Security (Zero Trust)
- **Never Trust the Client**: Users can edit JavaScript variables in the console.
    - *Apply this*: Even if the UI says "Disable Button", the backend must *also* check if the user is allowed to perform the action. We verified user roles (`mdAllowList`) on both client (for UX) and server (implied future step for API security).
- **Least Privilege**: Give a service/user only the permissions they barely need. Don't give "Admin" rights to the "Attendance Marker" bot.

## 6. Operation Excellence (Observability)
- **blind code is dead code**: If you don't know it failed, you can't fix it.
    - *FAANG Tip*: Log structured events, not just "Error".
    - *Bad*: `console.log("Error", err)`
    - *Good*: `console.error({ event: "attendance_mark_failed", userId: "123", error: err.message })`
- **Metric-Driven Decisions**: Don't guess what users want. Measure it. (e.g., Track how many people use Dark Mode).

## Summary Checklist for "FAANG Quality":
1.  [ ] **Does it handle bad internet?** (Offline mode/Retries)
2.  [ ] **Does it handle 10,000 users?** (Batching/Indexing)
3.  [ ] **Is it secure?** (Backend validation)
4.  [ ] **Is it readable?** (Clean code)
5.  [ ] **Is it monitored?** (Logging)
