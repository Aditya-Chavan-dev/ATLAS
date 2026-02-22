# Project Overview: ATLAS v2.0

> **Last Updated:** 22/02/2026
> **Stack:** React, Vite, Firebase (Auth, RTDB), TypeScript, Tailwind CSS
> **Status:** In Development

## What This App Does
ATLAS v2.0 is a clinical workforce management and attendance tracking system designed for absolute operational reliability. It solves the problem of decentralized attendance and leave tracking by providing a single, zero-trust platform for Employees and Management (MD). Users log in via Google, mark their attendance with geo-context (Office/Site), and manage their leave applications through a streamlined UI. The system is built to adhere strictly to the Firebase Spark (Free) Tier while providing premium, low-latency performance.

## The Tech Stack and Why
| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Chosen for superior developer experience and sub-second build times, ensuring a highly responsive SPA (Single Page Application) architecture. |
| Backend | Firebase (Serverless) | Provides a zero-cost, scalable backend infrastructure including Authentication and Realtime Database without the need for server management. |
| Database | Realtime Database | Specifically selected over Firestore for its lower latency on status-check queries and better fit for "Presence" and "Live" role updates. |
| Hosting | Firebase Hosting | (Planned) Guaranteed integration with the Firebase ecosystem and global CDN for fast static asset delivery at zero cost. |
| Authentication | Firebase Auth | Handles secure Google OAuth 2.0 flows and session management with clinical persistence guards. |

## How the App Is Structured
ATLAS v2.0 uses a modern Monorepo architecture to enforce type safety across all components. The frontend is a React application built with Vite, communicating directly with Firebase services via the serverless SDK. A dedicated `shared` package contains the standard TypeScript types (e.g., `AtlasUser`) used by both the application and future cloud environments. The architecture follows a "Hyper-Isolated" principle where features like Auth, Attendance, and Leave are encapsulated in their own directories with dedicated components and hooks.

## Features Built
| # | Feature Name | Status | Date Completed | File |
|---|---|---|---|---|
| 1 | Firebase Authentication | Complete | 22/02/2026 | docs/features/FEATURE_FIREBASE_AUTH.md |

## Key Project-Level Decisions

**Decision:** Adopted a Monorepo structure with a `Setup/` folder for clinical builds.
- **Why:** To cleanly separate build configurations and dependencies from the source code, allowing for an isolated and reproducible compilation pipeline.
- **Alternative considered:** Standard root-level configuration.
- **Why alternative was rejected:** It often leads to "dependency soup" where build-time tools and runtime libraries become indistinguishable, complicating large-scale audits.
- **Tradeoff accepted:** Slightly higher initial complexity in path mapping and `tsconfig` management.

**Decision:** Standardized on Firebase Realtime Database (RTDB) as the primary data store.
- **Why:** RTDB’s socket-based architecture is fundamentally superior for real-time presence and presence-based role updates, which are core to attendance tracking.
- **Alternative considered:** Firebase Firestore.
- **Why alternative was rejected:** Firestore's document-based structure and polling/snapshot logic are slower and more expensive for frequent, tiny status updates on a free tier.
- **Tradeoff accepted:** Data structure is limited to JSON trees rather than the more flexible document/collection model of Firestore.

## Known Gaps and Limitations
- **Deployment**: Local build works cleanly, but the CI/CD pipeline for automatic Firebase Hosting is not yet configured.
- **Mobile**: The UI is responsive but no dedicated PWA (Progressive Web App) manifests have been implemented for offline attendance marking.
- **RBAC**: The fundamental role types are defined, but the complex "Owner" governance console is still under development.

## How to Explain the Whole Project

### To an Interviewer
ATLAS v2.0 is a workforce management system I’m building with a focus on zero-cost scalability and clinical engineering. I chose a serverless React + Firebase stack to stay within the Spark Free Tier while maintaining a premium, high-performance user experience. The monorepo architecture ensures that our data models, like the `AtlasUser` type, are strictly enforced across the system. I’m most proud of the isolated build pipeline I designed, which ensures that our production builds are clean and entirely reproducible from a dedicated setup environment.

### To a Tech Peer
The project is a monorepo built using an isolated setup pattern. We’re leveraging Firebase RTDB for O(1) status lookups and real-time role synchronization. We use specialized `tsconfig` path mappings to bridge the `Setup/` build environment with the `apps/` and `packages/` source tree. This prevents the usual complexity of "node_modules" bleeding across the workspace. We also enforce a zero-trust auth flow where every Google login is checked against an internal RTDB whitelist before any internal routes are mounted.

### To a Client
ATLAS v2.0 is your digital command center for attendance and office management. It uses Google’s high-security login system to ensure your data stays private. It’s built to be extremely fast and reliable, working on both phones and computers, so your team can mark their presence with a single click. Most importantly, it's designed to run at zero monthly cost to you by using high-efficiency cloud technology.

## Top-Level Hard Questions

**Q: Why did you choose this tech stack over alternatives?**
A: Firebase provides the most robust toolkit for staying within a free tier without sacrificing real-time features. Alternatives like Supabase or self-hosted Postgres would require managing servers or dealing with significantly lower free-tier limits for real-time connections.

**Q: How does the frontend communicate with the backend?**
A: It uses the Firebase Web SDK v10+, which establishes a long-lived WebSocket connection to the Realtime Database. This allows the UI to update instantly when data changes on the server without the user needing to refresh their page.

**Q: How do you handle authentication and ensure users only see their own data?**
A: We combine Firebase Auth for identity with Realtime Database (RTDB) Security Rules for data access. Every data request is checked against a rule that says "Only allow this if the user is authenticated AND they own this data OR they have the MD/Owner role."

**Q: What happens if the server goes down or the database becomes unavailable?**
A: Since we use Google’s globally redundant infrastructure, a full "server down" is unlikely. However, if a user is offline, the app displays a clear network error message. We plan to implement local caching in the future to allow for offline attendance marking.

**Q: How would this app handle 10x more users?**
A: The RTDB is the bottleneck on the free tier (limited to 200,000 concurrent connections). At 10x our current target of ~100 users, we would still be well within the free limits. If we hit 1,000+ concurrent users, the only "break" would be moving from a free plan to a paid one; the code itself would require zero changes.

**Q: What would you build or fix next with more time?**
A: I would focus on the PWA (Progressive Web App) implementation. Adding service workers and offline support would make the attendance marking even more robust for employees working at sites with poor internet connectivity.

---
