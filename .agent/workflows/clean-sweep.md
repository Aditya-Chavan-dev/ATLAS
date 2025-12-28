---
description: A multi-phase deep dive to eliminate dead code, fix broken imports, and harden types.
---

Mode: Autonomous / High-Rigor

Constraint: Stability > Speed. No "best-effort" passes.

PHASE 0 — Workspace Ground Truth Establishment
Goal: Create a 1:1 map of the execution reality.

Enumerate Entry Points: * Identify standard entries: main.ts/tsx, index.ts/tsx.

Identify Framework-Specific entries: pages/, app/, api/, routes.ts, and background workers.

Asset Manifest: Index all non-code assets (CSS, images, fonts) to prevent "orphan" deletions of referenced media.

Resolve Module System: * Normalize tsconfig.paths aliases.

Resolve Barrel files (index.ts re-exports).

Dynamic Discovery: Flag all import() calls and string-based component loaders.

Freeze Baseline: * Capture current Build Output, Test State, and a JSON snapshot of TypeScript Diagnostic counts.

PHASE 1 — Dependency & Import Forensics
Goal: Validate structural integrity and reachability.

Broken Import Audit: * Resolve every symbol. If a file is missing, search the workspace for the symbol name before marking it as "Deleted."

Side-Effect Clause: Any import without a member list (e.g., import './init') is automatically protected as a side-effect module.

Circular Dependency Analysis: * Construct a Full Dependency Graph.

The "Value Cycle" Rule: Differentiate between Type-only cycles (safe) and Value cycles (dangerous).

Propose "Internal Module Pattern" refactors for Value cycles; do not extract to /utils if it increases fragmentation.

Global Export Liveness Proof: * Reflection Check: Before marking an export as 🔴 (Dead), perform a global string-grep. If the symbol appears in a string literal (e.g., component: 'UserTable'), mark it as 🟡 (Potential Reflection).

Negative Reachability Proof: Only delete 🔴 symbols that have zero static imports, zero dynamic imports, and zero string-based references.

PHASE 2 — Logic, Type, and Reachability Hardening
Goal: Repay technical debt without introducing "hallucinated" logic.

Dead Logic Elimination: * Framework Protection: Protect functions matching framework patterns (e.g., getServerSideProps, useEffect, @Decorators) even if they lack direct calls.

Build a call-graph for every method. If unreachable, cross-reference with the Reflection Check from Phase 1.

Type Evolution (Observational Only): * Harden any types only by observing actual property access in the code.

If a property data.id is accessed, the interface must include id. Do not assume other fields exist unless explicitly seen in the data source.

Zombie File Detection: * Classify files not reachable via the Entry Point graph.

Safety Check: Cross-reference the "Asset Manifest" from Phase 0. If a file is referenced by a CSS url() or a Vite asset helper, it is not a zombie.

PHASE 3 — Controlled Execution & Validation
Goal: Fail-closed, atomic application of changes.

Atomic Commits: * Apply one refactor at a time. After each change:

Diagnostic Count Check: Re-run TS diagnostics. If the error count increases, revert immediately.

Safety Net Enforcement: * Run npm run build and the full test suite.

Fail-Closed Policy: If the build fails, the agent must identify the specific broken link, revert that atomic commit, and flag the symbol as "Unsafe to Clean."

Regression Containment: * Freeze execution if a regression occurs that isn't resolved by a single-step revert. Provide a root-cause analysis artifact.

PHASE 4 — Forensic Report
Goal: Provide an executive-grade summary of the intervention.

Cleanup Ledger: * 🗑️ Deleted Files: (e.g., OldHeader.tsx - Proof: Unreachable from Main Graph & no string references).

✂️ Removed Exports: (e.g., export const unusedVar - Proof: No imports found).

🏗️ Type Hardening: (e.g., any -> UserInterface based on 4 usage points).

Blocked Items: List any dead-looking code that was preserved due to potential side-effects or reflection.

Efficiency Metrics: Net reduction in lines of code (LOC) and percentage reduction in dependency graph depth.