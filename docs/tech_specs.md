# Technical Specifications

This file documents the technical architecture, decisions, and patterns used in ATLAS v2.

## Architecture Guidelines

### 1. Technology Stack
- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** TanStack Query (Server) + Zustand (Client)

### 2. Directory Structure
```
src/
  features/       # Feature-based modular architecture
    auth/         # Authentication feature (Login, User context)
    dashboard/    # Dashboard feature
  shared/         # Shared utilities and components
    components/   # Reusable UI components (Buttons, Inputs)
    utils/        # Helper functions
```

### 3. Naming Conventions
- **Files:** `PascalCase.tsx` for components, `camelCase.ts` for logic.
- **Variables:** explicit and descriptive (e.g., `isSidebarOpen` not `open`).

## Changelog
- **2026-01-04:** Initial Project Setup (Vite + React-TS).
