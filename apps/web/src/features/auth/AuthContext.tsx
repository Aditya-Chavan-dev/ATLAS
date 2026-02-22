import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../../lib/firebase';
import { AtlasUser } from '@atlas/shared/types';

interface AuthContextType {
    user: User | null;
    dbUser: AtlasUser | null;
    loading: boolean;
    error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<AtlasUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // 🛡️ Strict Auth State Listener
        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser: User | null) => {
                setLoading(true);
                setError(null);

                if (firebaseUser) {
                    try {
                        // 🛡️ Identity vs Status Check: Fetch RTDB record before clearing loading
                        const userRef = ref(db, `users/${firebaseUser.uid}`);
                        const snapshot = await get(userRef);

                        if (snapshot.exists()) {
                            const data = snapshot.val() as AtlasUser;
                            setDbUser(data);
                            setUser(firebaseUser);
                        } else {
                            // User is authenticated but NOT in our database whitelist
                            setUser(null);
                            setDbUser(null);
                            setError(new Error('Unauthorized: Your account is not registered in the ATLAS system.'));
                        }
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
                        setUser(null);
                        setDbUser(null);
                    }
                } else {
                    setUser(null);
                    setDbUser(null);
                }

                setLoading(false);
            },
            (err: Error) => {
                setError(err);
                setLoading(false);
            }
        );

        // 🛡️ Essential Cleanup: Prevent memory leaks
        return () => unsubscribe();
    }, []);

    const value = {
        user,
        dbUser,
        loading,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 🛡️ Boundary-Safe useAuth Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
