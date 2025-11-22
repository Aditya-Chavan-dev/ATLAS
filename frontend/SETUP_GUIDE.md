# ATLAS Frontend Setup Guide

## Quick Answer: Will it work if I paste credentials in .env?

**YES!** Once you add your Firebase credentials to the `.env` file, the authentication will work. Here's what you need to do:

## Step-by-Step Setup

### 1. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **gear icon** ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. Click on the **Web app** (or create one if you don't have it)
6. Copy the `firebaseConfig` object values

### 2. Update `.env` File

Open `g:\ATLAS\frontend\.env` and replace the placeholder values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-12345
VITE_FIREBASE_STORAGE_BUCKET=your-project-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Backend API URL (already correct)
VITE_API_URL=http://localhost:5000/api
```

### 3. Enable Authentication Methods in Firebase

For the login page to work with **Google Sign-In** and **Phone Authentication**:

#### Enable Google Sign-In:
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → **Enable** → Save

#### Enable Phone Authentication:
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Phone** → **Enable**
3. Add your domain to authorized domains (for testing: `localhost`)
4. Configure reCAPTCHA (required for phone auth)

#### Enable Email/Password (for testing):
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Email/Password** → **Enable** → Save

### 4. Restart Dev Server

After updating `.env`, restart the Vite dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

**Important:** Vite only reads `.env` on startup, so you MUST restart after changes.

### 5. Test Authentication

Once configured, you can:
- ✅ Login with Google (click "Continue with Google")
- ✅ Login with Phone Number (enter number + OTP)
- ✅ Login with Email/Password (if you create a test user in Firebase Console)

## What Works Without Backend?

Even without the backend running, you can:
- ✅ **Login** (Firebase handles authentication)
- ✅ **Navigate** all pages (routing works)
- ✅ **See UI** (all components render)
- ❌ **Fetch data** (API calls will fail without backend)

The pages will show placeholder/mock data until you connect the backend.

## Testing Without Firebase (Alternative)

If you want to test the UI without setting up Firebase, you can temporarily modify `ProtectedRoute.jsx`:

```javascript
// Temporary bypass for testing (REMOVE BEFORE PRODUCTION)
const ProtectedRoute = ({ children }) => {
  // return children; // Uncomment this line to bypass auth
  
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
```

## Summary

**To answer your question:** Yes, pasting the Firebase credentials in the `.env` file is all you need for authentication to work! Just make sure to:

1. ✅ Add real Firebase credentials to `.env`
2. ✅ Enable authentication methods in Firebase Console
3. ✅ Restart the dev server
4. ✅ Test login functionality

The frontend is fully functional and ready to use once Firebase is configured!
