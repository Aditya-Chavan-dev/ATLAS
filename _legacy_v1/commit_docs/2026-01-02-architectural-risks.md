# Architectural Risk Audit: "The Big 5"
**Date:** January 02, 2026
**Topic:** Scalability & Security Factors driving the Feature-First Refactor

This document outlines the critical architectural vulnerabilities identified in the legacy "Direct Database" approach and justifies the transition to the "Clean API" architecture.

---

## 1. The "Data Iceberg" (Over-fetching)
**Severity:** CRITICAL
**The Issue:** Reference to `onValue(ref(database, 'employees'))` fetches the **entire node**.
**Impact:**
-   **Bandwidth:** Downloads megabytes of data (attendance history, logs, metadata) when only kilobytes (names/roles) are needed.
-   **Latency:** Page load times degrade linearly with every new employee and every new day of attendance.
-   **Cost:** Unnecessary scaling of Firebase download quotas.

## 2. The "Glass House" (Security)
**Severity:** CRITICAL
**The Issue:** Security relies entirely on Firebase Rules (`database.rules.json`).
**Impact:**
-   **Exposure:** The frontend *possesses* data it shouldn't allow the user to see. A compromised client or browser inspector reveals hidden fields.
-   **Fragility:** Complex rules (e.g., "Manager can see X but not Y") are hard to maintain in JSON. One mistake exposes the DB.
-   **Remediation:** Backend API ensures the client *never receives* sensitive data in the first place.

## 3. The "Tangled Web" (Reliability)
**Severity:** HIGH
**The Issue:** Business logic (e.g., "Is this user active?") is duplicated across multiple React components (`EmployeeManagement`, `Profiles`, `Dashboard`).
**Impact:**
-   **Inconsistency:** Updating logic in one place often leaves others broken.
-   **Bugs:** "Ghost" employees appearing in some lists but not others due to filtering mismatches.
-   **Maintenance:** Developers must hunt down every usage of `onValue` to make global changes.

## 4. The "Connection Cap" (Scalability)
**Severity:** HIGH
**The Issue:** `onValue` maintains a persistent WebSocket connection for every active user.
**Impact:**
-   **Hard Limits:** Firebase Realtime Database has strict limits on concurrent connections (e.g., 100 on lower tiers).
-   **DDoS Risk:** A sudden surge of users (e.g., 9:00 AM attendance marking) can max out connections, causing "Network Error" for everyone else.
-   **Solution:** APIs are stateless (Connect -> Fetch -> Disconnect), supporting thousands of concurrent users.

## 5. The "Logic Lease" (Performance)
**Severity:** MEDIUM
**The Issue:** Heavy computation (sorting, filtering, deriving stats) happens on the **Client Device**.
**Impact:**
-   **Battery Drain:** Mobile devices forced to process large arrays consume excessive power.
-   **UI Lag:** Older phones struggle to render lists derived from raw datasets, causing jank.
-   **Solution:** Server-side processing sends "Ready-to-Render" DTOs to the client.

---

## Conclusion
The refactor to **Feature-First Architecture** with a **Backend API Layer** is not just code cleanup; it is a necessary evolution to prevent system collapse under load and insure enterprise-grade security.
