# Task: ATLAS v2.0 - Attendance & Leave Management

Implementation of the Attendance Tracking and Logging Automation System (ATLAS) based on the Final PRD v2.0.

## Phase 0: Final Architecture & Logic (Zero Code)
- [x] Integrate PRD v2.0 into project docs <!-- id: 11 -->
- [x] Update `Architecture_spec.md` with Leave & MD systems <!-- id: 12 -->
- [ ] Update `Free_Tier_Audit.md` for Leave System overhead <!-- id: 13 -->
- [ ] Explicit User Sign-off on v2.0 Architecture <!-- id: 14 -->

## Phase 1: Core Infrastructure
- [ ] Initialize Root Repository & Workspaces (`apps/web`, `packages/shared`) <!-- id: 0 -->
- [ ] Workspace-wide TypeScript/ESLint/Prettier configuration <!-- id: 1 -->
- [ ] Shared Library Initialization:
    - [ ] IST Time Utilities (Luxon-based) <!-- id: 2 -->
    - [ ] Zod Schemas for Attendance & Leave <!-- id: 3 -->
    - [ ] Type Definitions for All Collections <!-- id: 4 -->

## Phase 2: Firebase Backend & Security
- [ ] Firebase CLI Project Setup <!-- id: 5 -->
- [ ] Firestore Security Rules (Zero-Trust Logic):
    - [ ] MD auto-approval enforcement <!-- id: 6 -->
    - [ ] Employee submission limits (max 2) <!-- id: 7 -->
    - [ ] Concurrent session checks <!-- id: 8 -->
- [ ] Root Admin Setup (Manual Custom Claim Assignment) <!-- id: 9 -->

## Phase 3: Core Features - Attendance
- [ ] Employee Attendance Submission (Office/Site) <!-- id: 15 -->
- [ ] MD Approval Dashboard (Bulk/Individual) <!-- id: 16 -->
- [ ] Sunday/Holiday Attendance → EL Credit Flow <!-- id: 17 -->
- [ ] MD Absent-to-Present Conversion Utility <!-- id: 18 -->

## Phase 4: Leave Management System
- [ ] Leave Application Flow (EL/AL/LOP) <!-- id: 19 -->
- [ ] Leave Approval/Rejection Workflow <!-- id: 20 -->
- [ ] Balance Reversal & Transaction Logging <!-- id: 21 -->
- [ ] MD Manual Balance Adjustments <!-- id: 22 -->

## Phase 5: PWA & UI/UX
- [ ] Premium Dashboard Design (Employee & MD Home) <!-- id: 23 -->
- [ ] Monthly Calendar Grid (All Statuses) <!-- id: 24 -->
- [ ] PWA Service Worker & Push Notifications <!-- id: 25 -->
- [ ] Single Session Enforcement (Client-side) <!-- id: 26 -->

## Phase 6: Reporting & Governance
- [ ] Employee PDF/CSV Calendar Export <!-- id: 27 -->
- [ ] MD XLSX Monthly Export (5k user optimized) <!-- id: 28 -->
- [ ] Audit Log Viewer (MD-side) <!-- id: 29 -->

---
**Verification Verification:**
- Zero Blaze usage (Spark plan compliance).
- Sub-second sync for dashboard updates.
- 100% security coverage in Firestore Rules.
