import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    AuthError,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

// 🛡️ Error Mapping System
export const mapAuthError = (error: AuthError): string => {
    switch (error.code) {
        case 'auth/popup-closed-by-user':
            return 'Login was cancelled. Please try again.';
        case 'auth/popup-blocked':
            return 'Login popup was blocked by your browser. Please allow popups for this site.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized for login. Please contact the administrator.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/operation-not-allowed':
            return 'Google Sign-In is not enabled. Please contact the administrator.';
        default:
            return 'An unexpected error occurred during login. Please try again later.';
    }
};

// 🔑 Isolated Google Sign-In Logic
export const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();

    // 🛡️ Strict Scopes & Account Selection
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        await signInWithPopup(auth, provider);
        // Note: Result is not returned as auth state is handled by onAuthStateChanged
    } catch (error) {
        const authError = error as AuthError;
        throw new Error(mapAuthError(authError));
    }
};

// 🚪 Isolated Sign-Out Logic
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        throw new Error('Failed to sign out. Please try again.');
    }
};
