# Feature: Firebase Authentication

> **Status:** Complete
> **Date Completed:** 22/02/2026
> **Part of:** Core Identity & Security Module
> **Files Involved:** `apps/web/src/lib/firebase.ts`, `apps/web/src/features/auth/AuthUtils.ts`, `apps/web/src/features/auth/AuthContext.tsx`, `apps/web/src/features/auth/ProtectedRoute.tsx`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/App.tsx`, `packages/shared/src/types.ts`

---

## 1. What This Feature Does (User-Facing)

The Firebase Authentication feature provides a secure entry point for ATLAS v2.0 users through a dedicated Login Portal. When a user arrives at the application, they are greeted by a modern, high-contrast interface and a "Continue with Google" button. Clicking this button opens a secure popup where the user selects their workspace email. Immediately after selection, the system verifies if the user is a registered member of the ATLAS system. If the account is valid, the user is instantly redirected to their personalized dashboard; if the account is not recognized, a clear error message is displayed, and access is strictly denied.

---

## 2. The Problem This Feature Solves

This feature solves the critical need for a zero-trust identity layer in a workspace management system. Without this feature, the application would be open to the public, risking data exposure and unauthorized attendance marking. By implementing a strict Google Auth combined with an internal whitelist check, we ensure that only verified employees and administrators can interact with sensitive workspace data, maintaining the clinical integrity of the entire system.

---

## 3. Technical Flow

**Trigger:**
The authentication flow is triggered when an unauthenticated user attempts to access any route within the application or manually navigates to the `/login` path. The `ProtectedRoute` component acts as the primary gatekeeper, detecting the absence of a verified session and redirecting the user to the `LoginPage`.

**Frontend — What Happens on the Screen:**
The `LoginPage` renders a high-performance UI using Vanilla CSS and Tailwind for zero-latency response. When the user clicks the "Continue with Google" button, the `handleLogin` function is invoked, which calls the `loginWithGoogle` utility. A loading spinner appears on the button to prevent duplicate submissions while the Google Auth popup is active. Once the user selects an account, the frontend awaits the Firebase Auth state change, which is managed reactively within the `AuthContext` provider.

**Backend — What the Server Does:**
The "backend" in this serverless architecture is handled by Firebase Auth and Realtime Database (RTDB) security rules. Firebase Auth validates the user's Google token and confirms their identity. Once validated, the `onAuthStateChanged` listener in our `AuthContext` fires. The system then performs a "Status Check" by querying the primary RTDB instance (`/users/$uid`) to ensure the user exists in our authorized registry. If the server finds the record, it returns the user's role and metadata; otherwise, it denies the request via restrictive security rules.

**Database — What Gets Stored or Retrieved:**
This feature primarily performs a Read operation on the `users` collection within the Firebase Realtime Database. It uses the `get(ref(db, 'users/' + uid))` query to retrieve the `AtlasUser` object, which contains the user's role, approval status, and last login metadata. No write operations occur during the login flow itself, as account creation is a separate administrative task managed by the Owner.

**Response — What Comes Back and What Happens Next:**
If the database record exists, the `AuthContext` updates its internal `dbUser` state with the `AtlasUser` data. The `ProtectedRoute` detects the populated `user` state and unblocks the rendering of requested internal routes (e.g., the Dashboard). If the record is missing, the context sets a descriptive `error` state, which the `LoginPage` then displays to the user. The entire transition from "Authorized" to "Dashboard" happens without a page refresh, utilizing React's reactive state engine.

---

## 4. Tech Used and Why

| Technology | What It Does in This Feature | Why This Specific Choice |
|---|---|---|
| Firebase Auth | Handles Google OAuth 2.0 and session persistence. | Selected for its seamless integration with the Realtime Database and out-of-the-box support for the Spark (Free) tier limits. |
| React Context API | Manages global authentication state across the entire monorepo. | Provides a clean, centralized way to access user data through the `useAuth` hook without prop-drilling or external library bloat. |
| RTDB (Firebase) | Stores the whitelist of authorized user IDs and their roles. | Used for sub-millisecond status checks, enabling the "Identity vs Status" verification required for the clinical baseline. |

---

## 5. Key Decisions and Why

**Decision:** Implemented an "Identity vs Status" dual-check in the `AuthContext` listener.
- **Why:** To prevent "ghost access" where a user is authenticated via Google but has been removed from our internal system.
- **Alternative considered:** Trusting the Firebase Auth token alone for basic access.
- **Why alternative was rejected:** It provides no way to granularly control which specific Google users have access to our private ATLAS workspace.
- **Tradeoff accepted:** Every login requires an additional network hit to the RTDB, slightly increasing the initial verification time (approx. 150ms).

**Decision:** Used `browserSessionPersistence` for session management.
- **Why:** To ensure that authentication states do not persist indefinitely on shared devices, aligning with workspace security standards.
- **Alternative considered:** `browserLocalPersistence` (persistent across tab closes).
- **Why alternative was rejected:** Local persistence increases the risk of session hijacking in the office environment if a user forgets to log out.
- **Tradeoff accepted:** Users must re-authenticate more frequently when closing their browser windows.

---

## 6. Edge Cases and Known Limitations

- **Empty or missing input:** User clicks login but forgets to select an account in the popup → Popup closes and the UI returns to the initial state without error.
- **Invalid format:** Attempting to log in with a non-Google account → The Google popup handles validation; our system only receives valid OAuth tokens.
- **Duplicate submission:** User spam-clicks the login button → `isLoggingIn` state and `loading` guards in `LoginPage.tsx` disable the button immediately after the first click.
- **Unauthorized access:** User logs in with a Google account not in our RTDB whitelist → `AuthContext` detects the missing record and throws an "Unauthorized" error shown in the UI.
- **Network failure:** Internet disconnects during the login popup → `AuthUtils.ts` catches `auth/network-request-failed` and displays a user-friendly retry message.
- **Slow response:** High latency on Firebase servers → The clinical spinner in `ProtectedRoute` and `LoginPage` provides visual feedback until the verification is complete.
- **Concurrent modification:** User role changes while they are logged in → Current implementation fetches role at login; real-time listener (planned) will address mid-session changes.
- **Data not found:** User UID is not present in the `/users/` path → Treated as "Unauthorized access" and the user is blocked from the dashboard.

**Known Limitations:**
- Initial account creation must be done manually in the RTDB as there is no public "Sign Up" flow.
- Real-time role updates (demotion without refresh) are scheduled for the next sub-phase (RBAC Refinement).

---

## 7. How to Explain This Feature

### To an Interviewer (Technical — They Are Judging Your Depth)

I implemented a zero-trust authentication system using Firebase Auth and React Context. The core of the implementation is a custom `AuthProvider` that wraps the entire application and utilizes a reactive `onAuthStateChanged` listener. What makes this implementation clinical is the "Identity vs Status" check: even after Google validates the user's identity, we perform a sub-millisecond query to the Realtime Database to verify that specific user's status in our internal whitelist. If the record is missing or the role is undefined, we force an unauthenticated state despite the valid Google token. I also included a `ProtectedRoute` component with an explicit loading boundary to prevent "FOUC" (Flash of Unauthenticated Content), ensuring the dashboard never renders until the full auth stack is verified.

### To a Tech Peer (They Know the Basics — They Want the Interesting Parts)

The most interesting part of this auth stack is the environment validator and the double-init guard in the `firebase.ts` utility. I built it so that if even one VITE variable is missing, the app throws a fatal error and refuses to boot, preventing silent failures in production. For the UI, I avoided the standard "logged in/logged out" boolean and instead used a 3-state state machine: `loading`, `user`, and `error`. This allowed me to handle the edge case where a user is technically "authenticated" by Firebase but "unauthorized" by our system without causing a loop in the router.

### To a Client or Non-Technical Stakeholder (They Care About Outcomes Only)

I have built a high-security lock for your application that uses Google as the identification method. When any employee clicks "Continue with Google," the system checks their email against your private staff list in real-time. If they aren't on the list, the door stays locked. It’s designed to be fast, modern, and extremely secure, ensuring that only your authorized team members can see company data.

---

## 8. Hard Questions and Counters

**Q: Why use a recursive RTDB check instead of just using Firebase Custom Claims for roles?**
A: Custom Claims are great but they suffer from a "propagation lag" of up to an hour unless you force a token refresh. For a clinical workspace app where an MD might need to revoke access per day, sub-second accuracy is non-negotiable. The RTDB fetch gives us instant "Identity vs Status" verification with zero lag on the Spark (Free) tier.

**Q: What happens if the `users/` node grows to thousands of entries? Won't that hit performance?**
A: We are using direct path access (e.g., `users/$uid`) rather than list filtering. RTDB handles direct path lookups in O(1) time regardless of the total number of users. This keeps the login speed consistent whether we have 10 employees or 10,000.

**Q: Why is the `AtlasUser` type stored in a shared package instead of just the web app?**
A: This is a monorepo-first decision. The `AtlasUser` type will eventually be needed by the cloud environment or potential mobile clients to ensure type safety. By centralizing it in `@atlas/shared`, we prevent "type drift" where different parts of the system have different ideas of what a "User" object looks like.

**Q: Is the API Key being "exposed" in the frontend a security risk?**
A: No, Firebase API keys are designed to be public. They only identify the project. The actual security is handled by our RTDB Rules and restricted Google OAuth origins, which I have configured to only allow your specific domain.

**Q: How do you handle the case where a user's Google account is disabled but their ATLAS session is still active?**
A: Firebase tokens are short-lived (1 hour). When it tries to refresh, Firebase will fail the refresh, and our `onAuthStateChanged` listener will fire, instantly updating the React state and kicking the user out.

**Q: If I wanted to add "Sign in with Microsoft" later, how hard would it be?**
A: The architecture is provider-agnostic. I’ve isolated the Google-specific logic into `AuthUtils.ts`. To add Microsoft, we’d just add a `MicrosoftAuthProvider` to that file and a new button to the UI; the entire state management and route guarding would remain unchanged.

---

*Last updated: 22/02/2026*
