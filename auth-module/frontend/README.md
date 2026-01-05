# Authentication Module

This folder contains all authentication-related code for ATLAS.

## 📁 Folder Structure

```
auth/
├── components/          # React components
│   ├── LoginPage.tsx   # Login page with Google OAuth
│   └── ProtectedRoute.tsx  # Route guard component
├── hooks/              # React hooks
│   └── useAuth.ts      # Authentication state hook
├── services/           # Business logic
│   └── authService.ts  # Firebase Auth operations
├── types/              # TypeScript types
│   └── auth.types.ts   # Auth-related type definitions
└── index.ts            # Public exports
```

## 🔐 How Authentication Works

### 1. Sign In
```typescript
import { useAuth } from '@/features/auth';

function MyComponent() {
  const { signIn } = useAuth();
  
  const handleSignIn = async () => {
    await signIn(); // Opens Google OAuth popup
  };
}
```

### 2. Check Authentication Status
```typescript
const { user, isAuthenticated, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!isAuthenticated) return <div>Please sign in</div>;
```

### 3. Protect Routes
```typescript
import { ProtectedRoute } from '@/features/auth';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 4. Sign Out
```typescript
const { signOut } = useAuth();

const handleSignOut = async () => {
  await signOut();
};
```

## 🔑 Getting ID Token

For making authenticated requests to backend:

```typescript
import { authService } from '@/features/auth';

const idToken = await authService.getIdToken();

fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

## 🛡️ Security Features

- **Google OAuth**: No passwords to manage
- **Email Whitelist**: Only approved emails can sign in
- **Custom Claims**: Role embedded in token (employee/md)
- **Token Versioning**: Instant logout capability
- **Protected Routes**: Automatic redirect to login

## 📝 Types

```typescript
import type { UserRole, UserDocument, CustomClaims } from '@/features/auth';

// UserRole = 'employee' | 'md'
// UserDocument = Firestore user document structure
// CustomClaims = { role, token_version }
```

## 🚀 Usage Example

```typescript
import { useAuth, ProtectedRoute } from '@/features/auth';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## 📖 Full Documentation

See [docs/technical/AUTHENTICATION.md](../../docs/technical/AUTHENTICATION.md) for complete authentication guide.
