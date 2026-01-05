import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';

export const authService = {
    // Sign in with Google and return user
    signInWithGoogle: async (): Promise<User> => {
        try {
            const { user } = await signInWithPopup(auth, googleProvider);
            return user;
        } catch (e: any) {
            if (e.code === 'auth/popup-closed-by-user') throw new Error('Sign-in cancelled');
            if (e.code === 'auth/unauthorized-domain') throw new Error('Domain not authorized');
            throw new Error(e.message || 'Sign-in failed');
        }
    },

    // Simple one-liners
    signOut: () => signOut(auth),
    getCurrentUser: () => auth.currentUser,

    // Get token with optional force refresh
    getIdToken: async (refresh = false): Promise<string> => {
        if (!auth.currentUser) throw new Error('Not authenticated');
        return auth.currentUser.getIdToken(refresh);
    },

    // Auth state listener
    onAuthStateChange: (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb)
};
