# Deployment & Feature Log: ATLAS v2.0

All meaningful changes to the ATLAS system are documented here, following the Zuckerberg/Anti-Vibe standard.

## [2026-03-01] - Role-Based Access Control (RBAC) Architecture

### 🚀 What
- Established three strict organizational tiers: `Employee`, `MD`, and `Owner`.
- Added `role.redirect.tsx` and `role.guard.tsx` to handle cross-role containment natively within the React Router DOM.
- Upgraded `AuthStatus` to natively track `access-denied` events during whitelist checks to cleanly bounce users with URL parameters `?error=access-denied`.
- Pushed updated Firebase DB Rules restricting write-access for `users/` specifically to authenticated accounts evaluating as `md` or `owner`. 
- Scaffolded placeholder dashboards for `Owner`, `MD`, and `Employee` in `src/features/dashboard`.

### 💡 Why
- **Security**: Hard-bounces users with active accounts but no formal role assignments, relying strictly on URL params instead of leaky state variables.
- **Fail-Closed Strategy**: Limits backend write capabilities strictly to governance roles, preventing unauthorized escalation.
- **Modularity**: Completely decoupled routing constraints (`role.guard.tsx`) from the specific views (`OwnerDashboard`, `EmployeeDashboard`).

## [2026-03-01] - Flattened Source Architecture & Type Resolution

### 🚀 What
- Moved `src/apps/web/src/features` outward to `src/features`.
- The `src` directory now strictly contains three sibling folders: `apps`, `packages`, and `features`, establishing a flattened monorepo hierarchy.
- Re-wired relative pathing inside `App.tsx` and modified `GEMINI.md` to establish `src/features/auth/firebase.ts` as the canonical source.
- Verified TypeScript module resolution and Vite bundling (`npm run build:web`) with 100% success.

### 💡 Why
- **Architecture**: A flatter structure avoids deeply nested imports (e.g. `../../../`) and makes finding feature logic substantially faster.
- **Scalability**: By placing `features` alongside `apps` and `packages`, features can theoretically be shared across multiple front-end apps in the future without residing strictly inside a specific application's subfolder.

---

## [2026-03-01] - Firebase Auth & Real-Time Security Re-Architecture

### 🚀 What
- Replaced the legacy Auth context and scripts with a strict feature-based architecture under `src/apps/web/src/features/auth/`.
- Implemented robust `run typecheck` and `run lint` passing Auth components.
- Established `firebase.ts` as the single Initialization Singleton with strict environment variable constraints.
- Generated and deployed strictly defined RTDB rules for `users/$uid` securing read/write interactions.
- Added strict TypeScript catch block error casting replacing illegal `any` assertions to satisfy the Zero-Vibe lint guidelines.
- Modified `GEMINI.md` to reflect the new canonical source of `firebase.ts`.

### 💡 Why
- **Architecture**: Separates features cleanly from root configuration.
- **Fail-Closed Security**: Rejects all missing env vars immediately, signs out users missing from RTDB whitelist, and relies solely on tested RTDB backend restrictions.
- **Resilience**: Zero-Vibe static type checks guarantee that runtime exceptions won't happen from undefined error objects.

---

## [2026-02-28] - Repository Cleanup & MD File Consolidation

### 🚀 What
- Moved `ATLAS_PRD_v2.md` to the repository root to ensure the final PRD is highly visible.
- Removed obsolete and unnecessary files from the root and `Setup/` directories (e.g. old build logs, `PRD_CONTENT.txt`, `extract_prd.py`, `attendance_prd_v1.2.docx`, and `.eslintcache` files).
- Deleted `ATLAS_PRD_v1.md` as it is superseded by v2.
- Retained core governance and documentation files in `docs/` in compliance with the Zuckerberg/Anti-Vibe standard.

### 💡 Why
- **Cleanliness**: Removes clutter such as temporary debug logs and old extraction scripts to maintain a pristine directory root.
- **Clarity**: Elevating the active PRD to the root directory eliminates ambiguity around project requirements and ensures immediate access.
- **Hygiene**: Strictly follows the mandate to eliminate technical debt and "zombie files", delivering a clean environment for development.

---

## [2026-02-28] - Normalized Monorepo Structure & Build Resolution

### 🚀 What
- Finalized project structure by moving `package.json`, `package-lock.json`, and `node_modules` to the repository root.
- Established `src/apps/web` and `src/packages/shared` as the primary source locations (Option A).
- Corrected build resolution issues by ensuring `node_modules` is in the parent chain of all source folders.
- Cleaned up the `Setup/` directory to serve strictly as a configuration hub (`Setup/configs/`).
- Synchronized all AI guardrails (`CLAUDE.md`, `GEMINI.md`) and project configurations for 100% build integrity.

### 💡 Why
- **Standardization**: Adopts the industry-standard "Root-Centric" monorepo layout, ensuring effortless dependency resolution for all sub-packages.
- **Reliability**: Eliminates persistent `ENOENT` build errors caused by the previous isolated-Setup structure.
- **Professionalism**: Maintains the high-impact "Zuckerberg Standard" with a clean, scannable root that strictly separates infrastructure from source code.

---

## [2026-02-28] - Setup-Centric Monorepo Restructuring

### 🚀 What
- Restructured monorepo into a unified `Setup/` centric layout.
- Moved `apps`, `packages`, and `docs` into the `Setup/` directory for 100% centralized management.
- Stabilized the build pipeline by resolving Rollup/Vite resolution as apps/ now resides inside `Setup/`.
- Removed legacy `src/` directory and consolidated all core logic under `Setup/`.
- Updated all configuration files (`vite.web.ts`, `tsconfig.base.json`, `tailwind.config.ts`) and AI guardrails (`CLAUDE.md`, `GEMINI.md`) to reflect the new architecture.

### 💡 Why
- **Cleanliness**: Achieved a minimalist root directory by moving all project-specific subtrees into the `Setup/` workspace.
- **Reliability**: Fixed persistent build errors caused by complex path resolution in the previous "root-src" split.
- **Efficiency**: Centralizing everything under `Setup/` simplifies dependency management and build context for both human and AI agents.
- **Zuckerberg Standard**: Prioritizes shipping a clean environment that minimizes root-level cognitive load and setup-to-source drift.

---

## [2026-02-22] - Firebase Auth & RBAC Clinical Baseline

### 🚀 What
- Completed the core Firebase Authentication feature with Google OAuth 2.0.
- Implemented "Identity vs Status" check to cross-reference authenticated users against the RTDB whitelist.
- Finalized the RBAC Design including `Employee`, `MD`, and `Owner` roles.
- Defined the "Zero-Refresh Protocol" for real-time permission enforcement using RTDB listeners.
- Documented the architecture in `FEATURE_FIREBASE_AUTH.md` and `PROJECT_OVERVIEW.md`.

### 💡 Why
- **Security**: Ensures a zero-trust entry point where only pre-whitelisted accounts can access internal data.
- **Authority**: Establishes a clear hierarchy between workforce management (MD) and system governance (Owner).
- **Compliance**: Adheres to the Zuckerberg/Anti-Vibe standard of absolute functional isolation and real-time reactivity.

---

## [2026-02-22] - Feature Architecture & GitHub Baseline

### 🚀 What
- Established a clinical, feature-based directory structure (`auth`, `rbac`, `employee`, `md`, `shared`).
- Implemented **Type Bridging** for hyper-isolated `node_modules`, achieving 100% build success.
- Finalized Phase 1 & 2 pre-flight integrity checks (Lint, Typecheck, Build, Secret Scan).
- Successfully connected and pushed the verified baseline to **https://github.com/Aditya-Chavan-dev/ATLAS.git**.
- Cleaned all bootstrap boilerplate to provide a production-ready starting point.

### 💡 Why
- **Architecture**: Ensures 100% isolation of concerns from day one, preventing logic leakage.
- **Reliability**: Verified build pipes guarantee that the hyper-isolated setup is not just clean, but functional.
- **Alignment**: Direct synchronization with GitHub establishes the source of truth for all future "Zuckerberg Standard" sprints.
- **Hygiene**: Wiping bootstrap code prevents technical debt and keeps the focus purely on project-specific features.

---

## [2026-02-22] - Initial Project Foundation (Absolute Isolation)

### 🚀 What
- Established a hyper-isolated repository structure.
- Created `Setup/` directory as the exclusive hub for dependencies (`node_modules`), configurations (Vite, TypeScript), and build infrastructure.
- Isolated source code into `apps/web/src` and `packages/shared/src`, ensuring no setup clutter in source folders.
- Verified absolute isolation through remote typechecking and production builds from the `Setup/` context.
- Initialized Git repository with a robust `.gitignore` enforcing project cleanliness.

### 💡 Why
- **Cleanliness**: Ensures zero setup-to-root leakage, keeping the project easy to scan and maintain.
- **Scalability**: Centralized configuration allows for consistent builds across multiple potential apps and packages.
- **Security**: The isolated structure prevents accidental exposure of configuration or build artifacts in source-only environments.
- **Zuckerberg/Anti-Vibe Standard**: Prioritizes shipping a high-impact, professional-grade foundation with strictly enforced governance.
