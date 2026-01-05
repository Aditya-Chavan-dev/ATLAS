# ATLAS Authentication: The Technical Blueprint 📐

> **First Principle:** Security is about establishing **Trust**. We cannot trust the client (browser), so we must verify everything on the server.

This document explains the **exact authentication flow** implemented in ATLAS v2. It breaks down the process step-by-step, mixing the actual code logic with simple technical explanations.

---

## 🔁 The End-to-End Authentication Flow

### Step 1: The Request (Frontend Initiation)
**Goal:** The user wants to enter. We need a credential to prove who they are.

The process begins in `LoginPage.tsx` when the user clicks "Sign in". We call our `authService`.

```typescript
// frontend/services/authService.ts
const { user } = await signInWithPopup(auth, googleProvider);
```

**What really happens:**
1.  Firebase SDK opens a popup to `accounts.google.com`.
2.  User enters credentials directly to Google (ATLAS never sees the password).
3.  Google verifies these credentials.
4.  Google issues an **ID Token** (a cryptographically signed JWT) to the browser.

---

### Step 2: The Trigger (Backend Interception)
**Goal:** We know *who* they are (Identity), but we need to check if they are *allowed* (Authorization).

We don't trust the frontend to tell us if the user is allowed. Instead, we use a **Cloud Function trigger** that fires automatically on the server whenever a new user is created.

```typescript
// backend/onUserCreate.ts
export const onUserCreate = functions.auth.user().onCreate(async (user) => { ... })
```

**Why this matters:**
This code runs in a trusted environment (Google Cloud). The user cannot modify it, bypass it, or see it.

---

### Step 3: Verification (The Whitelist Check)
**Goal:** Ensure the user belongs to our organization.

Inside the trigger, we query our "Source of Truth"—the Firestore database. We look for a document in the `users` collection that matches the email.

```typescript
// backend/onUserCreate.ts
const snapshot = await usersRef.where('email', '==', user.email).get();

if (snapshot.empty) {
    // ⛔ SECURITY ENFORCEMENT
    await admin.auth().deleteUser(user.uid);
    throw new Error('Not authorized');
}
```

**The Logic:**
-   **If found:** The user is an employee. Proceed.
-   **If not found:** This is an intruder. deeply delete the auth account immediately. The user gets a generic error on the frontend and cannot sign in again.

---

### Step 4: Stamping (Custom Claims)
**Goal:** Embed permissions directly into the user's ID Card (Token) so we don't have to look them up in the database for every single request.

If the user is valid, we take their role (e.g., 'employee' or 'md') from the database and "stamp" it onto their auth profile using **Custom Claims**.

```typescript
// backend/onUserCreate.ts
await admin.auth().setCustomUserClaims(uid, {
    role: userData.role,  // e.g., 'md'
    token_version: 1      // For security invalidation
});
```

**Result:**
The next time the user's token refreshes, it will contain this payload:
```json
{
  "uid": "12345",
  "role": "md",
  "token_version": 1
}
```
This allow us to check permissions (`user.claims.role`) instantly on both frontend and backend.

---

### Step 5: The Session (Frontend State)
**Goal:** The browser needs to remember the user is logged in.

Back on the frontend, our `useAuth` hook is listening. Firebase SDK manages the session automatically (storing the token in IndexedDB).

```typescript
// frontend/hooks/useAuth.ts
useEffect(() => authService.onAuthStateChange(user => {
    setUser(user); // React state updates, triggering a re-render
}), []);
```

---

### Step 6: Routing (The Logic Gate)
**Goal:** Show the correct interface based on the user's identity.

In `App.tsx`, we inspect the validated user object. Since this is a restricted app, we implement a hard logic gate based on specific criteria.

**Note:** In Phase 1, we use Email-based routing for the Owner.

```typescript
// src/App.tsx
if (user.email === 'adityagchavan3@gmail.com') {
    return <OwnerPage />; // The 'md' equivalent
} else {
    return <MaintenancePage />; // Everyone else
}
```

---

## 🛡️ Security Mechanisms Explained

### 1. Token Versioning (The Kill Switch)
**Problem:** JWTs (tokens) are valid for 1 hour. If we ban a user, their token is still valid for up to 59 minutes.
**Solution:** `token_version`.

We stamp `token_version: 1` on the token.
To ban a user, we change the database version to `2`.
Our backend verification function checks:

```typescript
// backend/verifyTokenVersion.ts
if (token.token_version !== database.token_version) {
    throw new Error('Token revoked'); // Instant lockout
}
```

### 2. Zero-Trust Access
We verify the user's email against the whitelist on **every single first sign-in**. There is no "open registration". If you aren't pre-approved in the database, you cannot even create an account.

---

## 📁 Code Architecture

| Component | Responsibility | Technical Implementation |
| :--- | :--- | :--- |
| **Auth Service** | **Transport** | `firebase/auth` SDK wrapper. Handles HTTP calls to Google. |
| **UseAuth Hook** | **State** | React Context/Effect wrapper. Syncs Firebase state to React UI. |
| **Cloud Trigger** | **Policy** | `functions.auth.user().onCreate`. The absolute security gate. |
| **Firestore** | **Source of Truth** | Stores actual employee data and roles. |

---

> **Summary:**
> We use **Google** for identity (passwords/MFA), **Firestore** for authorization (roles/whitelist), and **Cloud Functions** to bridge the two securely. The frontend simply reflects the state determined by the server.
