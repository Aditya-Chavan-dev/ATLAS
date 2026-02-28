---
description: This workflow performs a comprehensive technical debt audit on the entire codebase, file by file. It scans for 85 categories of technical debt across code quality, security, architecture, performance, accessibility, and more.
globs:
alwaysApply: false
---

# /techDebt — Technical Debt Auditor Workflow

## Workflow Description
This workflow performs a comprehensive technical debt audit on the entire codebase, file by file. It scans for 85 categories of technical debt across code quality, security, architecture, performance, accessibility, and more. It is specifically designed for a React (frontend) + Firebase (RTDB & Auth) monorepo stack. Once triggered, it produces a single structured Markdown report with every issue found, ordered by priority (High → Medium → Low), with a concrete fix, code example, and effort estimate for each.

## Trigger
Manual — run this workflow whenever you want a full debt audit of the codebase by typing /techDebt.

---

## Prompt

You are a senior FAANG-level code auditor specializing in React and Firebase monorepo architectures. Your job is to define and execute a repeatable technical debt audit workflow that scans the entire codebase file by file and produces a single structured Markdown report every time it is triggered.

---

### PROJECT CONTEXT

- **Frontend:** React
- **Backend:** Firebase Realtime Database and Auth (100% Client-side)
- **Database:** Firebase / RTDB
- **Hosting:** Firebase Hosting
- **Monorepo structure:** `/src/apps/web`, `/src/packages/shared`, `/src/Setup`
- **CI/CD:** GitHub Actions

---

### WHAT THIS WORKFLOW DOES EVERY TIME IT IS TRIGGERED

1. Scans every file in the codebase one by one — no file is skipped
2. For each file, checks for all 85 debt types listed below
3. Logs every instance of debt found with file path, line number, and full details
4. Compiles everything into one single Markdown report at the end
5. Orders all issues by priority: 🔴 High → 🟡 Medium → 🟢 Low

---

### DEBT TYPES TO DETECT (85 TOTAL)

#### Code Quality
1. **Messy / inconsistent code** — Code that doesn't follow a consistent style or pattern across the codebase, making it hard to read and maintain.
2. **Duplicate code** — Same logic written in multiple places, meaning a change must be replicated everywhere or bugs appear.
3. **Component complexity** — React components doing too many things at once instead of being split into smaller, focused, reusable pieces.
4. **Naming inconsistencies** — Mix of camelCase, snake_case, PascalCase across files and variables creating unnecessary confusion.
5. **Magic numbers & hardcoded values** — Raw numbers or strings scattered in code with no explanation or central constants file.

#### Security & Safety
6. **Security vulnerabilities** — Secrets, API keys, or sensitive config hardcoded directly in source files, a critical risk if the repo is exposed.
7. **Error handling gaps** — Promises that aren't caught, missing try/catch blocks, or errors that silently fail leading to unpredictable crashes.
8. **Race conditions & async debt** — Async flows that assume a certain order of execution without guaranteeing it, causing hard-to-reproduce bugs.
9. **Data validation gaps** — User input or API payloads not sanitized or validated, open door for bad data, crashes, or injection attacks.
10. **Git hygiene** — Large files committed to the repo, secrets in git history, or a poorly configured .gitignore that exposes sensitive files.
11. **Rate limiting & abuse prevention** — API endpoints with no throttling, meaning a single bad actor or runaway client can bring down the backend.

#### Architecture & Structure
12. **Poor folder structure** — Files placed arbitrarily with no clear convention, making it impossible to find anything without searching.
13. **State management debt** — Prop drilling through multiple component levels or a bloated global store managing things it shouldn't.
14. **API contract issues** — Endpoints returning inconsistent shapes, missing error codes, or undocumented responses that frontend must guess.
15. **Monorepo health** — Packages importing each other in circles, or shared logic duplicated across apps instead of extracted into shared packages.
16. **Dead code** — Functions, variables, and imports that exist but are never used, adding noise and increasing bundle size.
17. **Code coupling** — Business logic tangled directly inside React components, making logic impossible to test or reuse independently.
18. **Feature flag debt** — Old feature toggles never removed after launch, or flags hardcoded to true/false instead of being properly managed.

#### TypeScript & Documentation
19. **TypeScript weaknesses** — Overuse of `any`, missing return types, or untyped third-party integrations that defeat the purpose of TypeScript.
20. **Missing documentation** — Functions, modules, and APIs with no explanation of what they do, why they exist, or how to use them.
21. **Environment config debt** — No `.env.example` file, inconsistently named variables, or env vars that differ between environments with no clear mapping.

#### Dependencies & Packages
22. **Outdated dependencies** — Packages running on old versions with known bugs, security vulnerabilities, or deprecated APIs that will eventually break.
23. **Dependency hygiene** — Packages installed but never used, or two different packages doing the exact same job installed simultaneously.

#### Performance & Resilience
24. **Performance anti-patterns** — Unnecessary re-renders in React, blocking synchronous operations, or expensive computations running on every render.
25. **Bundle & performance budget** — Oversized JavaScript bundles, unoptimized images, or no lazy loading directly hurting load time and user experience.
26. **Firebase-specific issues** — Missing indexes causing slow RTDB reads, or security rules that are too open or rely on unscalable massive wildcard fetches.
27. **Caching strategy gaps** — Expensive API calls or Firebase reads happening on every request with no caching layer, wasting bandwidth and slowing everything down.
28. **Retry & resilience gaps** — No retry logic when Firebase calls fail, meaning a single network hiccup causes an unnecessary user-facing error.
29. **Memory leak risks** — Firebase listeners, React subscriptions, or event listeners set up but never cleaned up, causing apps to degrade over time.

#### Observability & Ops
31. **Logging & observability gaps** — `console.log` left in production code, no structured logging, and no error tracking tool meaning you're blind when things break.
32. **CI/CD debt** — Pipelines that are slow, missing critical steps like security scans, or have no caching making every deployment slower than it should be.
33. **Date & timezone debt** — Raw `new Date()` usage scattered everywhere with no consistent library or timezone handling, causing subtle hard-to-debug bugs.

#### Accessibility & i18n
34. **Accessibility issues** — Missing alt tags, no aria labels, poor keyboard navigation excluding users with disabilities and failing compliance standards.
35. **i18n & localization gaps** — Strings hardcoded in English directly in components making retrofitting multi-language support extremely painful later.

#### Legal
36. **License & legal debt** — Packages with incompatible licenses or a missing LICENSE file in the repo, a serious legal issue for commercial projects.

#### API & Network Layer
37. **Pagination debt** — Loading entire datasets from Firestore or API with no cursor or offset pagination, destroying performance at scale.
38. **API versioning gaps** — No versioning strategy meaning breaking changes silently break all existing clients with no migration path.
39. **Webhook reliability** — No retry logic, no signature verification, and no idempotency on webhook handlers, leading to missed or duplicate events.
40. **CORS misconfiguration** — Too permissive CORS settings or inconsistent configuration across environments, creating security vulnerabilities.
41. **Response time debt** — No timeouts set on external API calls meaning one slow third-party service can hang your entire backend indefinitely.

#### Frontend & UX Debt
42. **No loading/skeleton states** — UI freezes or shows blank while data loads instead of communicating progress to the user.
43. **No empty states** — Nothing shown when a list or page has no data, leaving users confused about whether something is broken or just empty.
44. **No error boundaries** — One crashing React component takes down the entire page instead of failing gracefully in isolation.
45. **Hardcoded breakpoints** — Magic pixel values scattered across CSS instead of a consistent responsive design system, breaking on unexpected screen sizes.
46. **No optimistic updates** — UI waits for server confirmation before reflecting changes, making the app feel slow even on fast connections.

#### Data & Database Layer
47. **No database indexing strategy** — Firestore queries running without composite indexes, causing slow reads and rejected queries at scale.
48. **Overfetching** — Fetching entire Firestore documents when only one field is needed, wasting bandwidth and increasing costs.
49. **No data archiving strategy** — Old data piling up in Firestore indefinitely with no cleanup, causing costs to grow and queries to slow down.
50. **Transactional gaps** — Multi-step Firestore writes not wrapped in transactions, meaning partial failures leave data in an inconsistent state.
51. **No backup or disaster recovery plan** — No strategy for recovering data if Firestore is accidentally wiped or corrupted.

#### Auth & Security Depth
52. **No authentication refresh strategy** — Tokens expiring mid-session with no silent refresh, forcing users to log out unexpectedly.
53. **Missing role-based access control** — Everyone has the same permissions with no distinction between admin, user, or guest roles.
54. **No audit trail** — No record of who did what and when, making it impossible to investigate issues or meet compliance requirements.
55. **Session management debt** — No session expiry, no concurrent session handling, or no way to invalidate a session when a user is compromised.
56. **Missing HTTPS enforcement** — Mixed content warnings, no redirect from HTTP to HTTPS, leaving data transfers vulnerable to interception.

#### Monitoring & Analytics
57. **No performance monitoring** — No real user metrics or Core Web Vitals tracking meaning you don't know how the app actually performs for real users.
58. **No alerting strategy** — No alerts configured when errors spike, API goes down, or Cloud Functions start failing, so issues are discovered by users first.
59. **Missing health check endpoints** — No endpoint to verify the API is alive, making it impossible to integrate with uptime monitors or load balancers.

#### Team & Process Debt
60. **No ADRs** — Architecture decisions never documented, so the context and reasoning behind major choices is lost when team members leave.
61. **Onboarding debt** — No README or setup guide meaning new developers spend days just getting the project running locally.
62. **No versioning strategy for shared packages** — Shared monorepo packages with no versioning, causing silent breaking changes across apps.
63. **PR size debt** — Massive pull requests that are impossible to review meaningfully, leading to rubber-stamp approvals and missed bugs.

#### Architecture Maturity
63. **No graceful degradation** — The entire app breaks when a network call goes down instead of falling back to a reduced but functional state.
64. **No feature rollback strategy** — No way to turn off a bad feature without a full redeployment, increasing the risk and cost of every release.
65. **Cold data vs hot data separation** — Everything stored in the same RTDB node regardless of access frequency, making hot path queries unnecessarily expensive.
66. **No query result caching on frontend** — Same Firebase reads triggered on every navigation with no client-side cache, burning bandwidth and slowing the UI.
67. **Over-engineering** — Abstractions and patterns built for a scale that doesn't exist yet, adding complexity with no current benefit.

#### Testing Depth
68. **Test data debt** — Tests relying on real production data or hardcoded IDs that break when data changes or environments differ.
69. **Missing integration tests** — Individual units pass but the system breaks when they're combined, catching nothing until it's in production.
70. **No load/stress testing** — No idea how the system behaves under real traffic, so the first time you find the breaking point is during a spike.

#### Mandatory Basics
73. **No input length limits** — API and forms accepting unlimited input length, open to abuse, excessive storage costs, and crashes.
74. **No 404 / error pages** — App crashes or shows a blank screen when a route doesn't exist instead of a helpful error page.
75. **No confirmation on destructive actions** — Delete or irreversible actions with no confirmation step, making accidental data loss trivially easy.
76. **Inconsistent API error messages** — Some errors return strings, some return objects, some return HTML, making uniform frontend error handling impossible.
77. **No pagination on frontend lists** — Rendering hundreds or thousands of items in a list with no virtualization or pagination, killing browser performance.
78. **No logout on all devices** — Users can't invalidate sessions across all devices when their account is compromised.
79. **No image optimization** — Raw uncompressed images served directly with no React/Firebase optimization, causing massive unnecessary load times.
80. **No favicon or app icons** — Missing favicon and PWA icons making the app look unfinished and unprofessional.
80. **No HTTP caching headers** — API responses not setting cache-control headers meaning every request hits the server fresh unnecessarily.
81. **No content security policy (CSP)** — Missing security headers leaving the app vulnerable to XSS and other injection attacks.
82. **No API documentation** — Custom hooks or core services exist but nobody knows how to use them without reading the source code directly.
83. **Inconsistent loading UX** — Some parts of the app show spinners, others freeze, others show skeletons with no consistent pattern across the product.

---

### FOR EACH ISSUE FOUND, OUTPUT THE FOLLOWING FORMAT

```
### [PRIORITY: HIGH / MEDIUM / LOW] — [Debt Type Name]

**File:** `path/to/file.tsx` (Line: XX)

**Issue:** Exactly what is wrong and where.

**Why it matters:** The real consequence of leaving this unfixed.

**Suggested fix:** Concrete, specific action to resolve it.

**Code example:**
// Before
[problematic code]

// After
[fixed code]

**Effort estimate:** [e.g. 15 mins / 1 hour / half a day / 1 day]
```

---

### FINAL REPORT STRUCTURE

```markdown
# Technical Debt Audit Report

**Project:** [Project Name]
**Date:** [Date triggered]
**Files Scanned:** [X]
**Total Issues Found:** [X]
**High Priority:** [X] | **Medium Priority:** [X] | **Low Priority:** [X]

---

## 🔴 High Priority
[All high priority issues in above format]

---

## 🟡 Medium Priority
[All medium priority issues in above format]

---

## 🟢 Low Priority
[All low priority issues in above format]

---

## Summary
[3-5 sentence overview of the overall health of the codebase, the biggest risk areas, and the recommended order for tackling the debt]
```

---

### STRICT RULES FOR THIS WORKFLOW

- Scan **every single file** without skipping any
- Always include the **exact file path and line number** for every issue
- Never be vague — "improve error handling" is not acceptable; show exactly what is missing and exactly how to fix it
- If a debt type is **not found** in the codebase, do not mention it
- **Do not auto-fix anything** — this is a report only, the developer applies fixes manually
- Do not group multiple issues into one — **each instance of debt is its own entry**
- Prioritize ruthlessly:
  - 🔴 **High** = security risk or production breakage
  - 🟡 **Medium** = maintainability or performance impact
  - 🟢 **Low** = code quality or polish
- The **code example must always show a before and after**
- The **effort estimate must be realistic**, not optimistic
- This workflow produces **one single Markdown report** per run — not per file, not per category
