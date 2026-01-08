import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { authService } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        try {
            setError(null);
            await authService.signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            await authService.signOut();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return { user, loading, error, signIn, signOut };
}
