// src/features/auth/auth.context.tsx

import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from './firebase.config';
import type { AtlasUser, AuthStatus } from './auth.types';

export interface AuthContextValue {
    user: AtlasUser | null;
    status: AuthStatus;
    authError: string | null;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AtlasUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setStatus('unauthenticated');
                return;
            }

            try {
                const snapshot = await get(ref(db, `users/${firebaseUser.uid}`));

                if (!snapshot.exists() || !snapshot.val().isWhitelisted) {
                    // User authenticated with Firebase but is not whitelisted — boot them
                    await signOut(auth);
                    setUser(null);
                    setStatus('access-denied');
                    return;
                }

                const data = snapshot.val();

                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    role: data.role,
                    displayName: data.displayName,
                    isWhitelisted: true,
                });
                setStatus('authenticated');
                setAuthError(null); // Clear errors on success

            } catch (err) {
                console.error("Firebase RTDB Error:", err);
                // RTDB read failed — fail closed, never leave state ambiguous
                await signOut(auth);
                setUser(null);
                setStatus('unauthenticated');
                setAuthError('Access Denied: Could not reach the whitelist database.');
            }
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, status, authError, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
