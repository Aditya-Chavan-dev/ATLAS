3# GEMINI.md — Project Rules for Gemini Agents

> [!CAUTION] 
> 🔒 LOCKED SECTION - AI SYSTEM SAFEGUARDS
> These rules are non-negotiable. Breaking them will cause system failure.
> 1. NEVER suggest or use Firestore. Use Realtime Database (RTDB) only.
> 2. NEVER suggest or use Node.js, Express, or Firebase Cloud Functions. The backend is 100% Client-Side + Rules.
> 3. NEVER create a `User` type or interface. Always use `AtlasUser` from `@atlas/shared`.
> 4. NEVER add the 'admin' role. The only roles are 'employee' and 'md'.
> 5. ALWAYS barrel import from `@atlas/shared`, which resolves exactly to `packages/shared/src/index.ts`.

> This file is read automatically by Gemini agents working in this repository.
> These are **non-negotiable architectural guardrails** based on past errors.
> Violating these rules has caused build failures and type errors before.

---

## 🏗️ Project Identity

- **Name**: ATLAS v2.0
- **Stack**: Vite + React 18 + TypeScript + Firebase (Auth + RTDB)
- **Monorepo Layout**: `src/apps/web` (frontend) + `src/features` (feature modules) + `src/packages/shared` (shared types) + `Setup/` (shared build configs) + `docs/` (documentation) + Root `node_modules` & `package.json`
- **Constraint**: Firebase Free Tier (Spark Plan) — no Cloud Functions, no Blaze features

---

## 🔴 CRITICAL RULES — Never Violate These

### 1. Shared Types: Single Source of Truth
- **ALL** shared types live in `src/packages/shared/src/types.ts`
- **ALWAYS** re-export from `src/packages/shared/src/index.ts` using `export * from './types'`
- **NEVER** define ad-hoc type aliases or interfaces directly inside `index.ts`
- **NEVER** create a `User` type — the canonical type is `AtlasUser` (from `types.ts`)
- **NEVER** duplicate type definitions across files

**Why this rule exists**: A `User` interface with wrong shape `{ id, name, role }` was placed in `index.ts`, silently conflicting with the real `AtlasUser { uid, email, displayName, role, ... }`. This creates invisible type drift that breaks builds and the barrel import.

### 2. Import Strategy for Shared Types
- **Preferred (barrel)**: `import { AtlasUser, UserRole } from '@atlas/shared'`
- **Also valid (direct)**: `import { AtlasUser } from '@atlas/shared/types'`
- **NEVER** re-type or re-define `AtlasUser` locally in any `apps/web` file

### 3. Path Aliases
| Alias | Resolves To |
|-------|------------|
| `@atlas/shared` | `src/packages/shared/src/index.ts` (barrel) |
| `@atlas/shared/types` | `src/packages/shared/src/types.ts` (direct) |
| `@/*` | `src/apps/web/src/*` |

These aliases are strictly mapped. Ensure `@atlas/shared` points exactly to `index.ts` to prevent barrel import breakage.

### 4. No Duplicate Firebase Initialization
- Firebase is initialized **once** in `src/features/auth/firebase.config.ts`
- Import `{ app, auth, db }` from that file everywhere
- **NEVER** call `initializeApp()` anywhere else

### 5. TypeScript Discipline
- **Never** use `any` in auth-related code (`AuthContext.tsx`, `AuthUtils.ts`, `ProtectedRoute.tsx`)
- All `catch` blocks must type-guard: `err instanceof Error ? err : new Error('...')`
- Run `npm run typecheck` from `Setup/` before marking any task complete

### 6. No Zombie Code
- Remove obsolete types/functions immediately when replacing them
- Do not leave old type definitions "just in case"

---

## 🟡 ARCHITECTURE RULES

### Role Values (UserRole)
The enum values for roles are **lowercase strings**:
```typescript
type UserRole = 'employee' | 'md';
```
**Never** use `'MD' | 'Employee' | 'Project_Admin'` — that was the old wrong format.

### Auth Flow
1. `firebase/auth` triggers `onAuthStateChanged` (managed in `AuthContext.tsx`)
2. Auth state checks `users/{uid}` in RTDB — whitelist-only access
3. `ProtectedRoute.tsx` guards all non-login routes
4. Session persistence is set to `browserSessionPersistence` (no cross-session tokens)

### Free Tier Compliance
- Never suggest Cloud Functions, Blaze plan features, or paid GCP services
- All business logic must run client-side or via Firestore Security Rules
- RTDB bandwidth limit: 10 GB/month — design queries to be minimal

---

## ✅ Before Marking Any Task Complete

```bash
cd Setup

npm run lint        # Must show 0 errors
```

---

## ⚠️ DANGER ZONE WARNING

**BANNED INSTRUCTIONS & PATTERNS:**
- ❌ Do NOT use Firestore `collection()` or `doc()`. Use RTDB `ref()`, `get()`, `set()`, `update()`.
- ❌ Do NOT try to use Cloud Functions for backend logic, crons, or processing.
- ❌ Do NOT try to bypass the Free Tier limitations.
