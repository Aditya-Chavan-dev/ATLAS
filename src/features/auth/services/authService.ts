import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, googleProvider, database } from '@/lib/firebase/config';

export const authService = {
    // Sign in with Google and return user
    signInWithGoogle: async (): Promise<User> => {
        try {
            const { user } = await signInWithPopup(auth, googleProvider);

            // "Self-Onboarding": Check & Create Profile if needed
            const userRef = ref(database, `employees/${user.uid}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                await set(userRef, createNewProfile(user));
            } else {
                await set(ref(database, `employees/${user.uid}/profile/lastLogin`), Date.now());
            }

            return user;
        } catch (e: any) {
            throw new Error(e.message || 'Authentication failed');
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

// Helper: Defines the standard structure for new employees
const createNewProfile = (user: User) => ({
    profile: {
        uid: user.uid,
        name: user.displayName || 'Employee',
        email: user.email,
        photoURL: user.photoURL || '',
        role: 'employee', // Hardcoded security
        status: 'active',
        createdAt: Date.now(),
        lastLogin: Date.now()
    },
    leaveBalance: { pl: 0, co: 0 }
});
