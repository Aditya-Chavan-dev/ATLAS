// 🪝 useAuth Hook - React's way of tracking who's signed in
// Think of this as a "security camera" that watches the door

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 📹 Watch for sign-in/sign-out events
    useEffect(() => {
        return authService.onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });
    }, []);

    // 🚪 Sign in (async = wait for Google popup to finish)
    const signIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 👋 Sign out
    const signOut = async () => {
        setLoading(true);
        try {
            await authService.signOut();
            setUser(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, error, signIn, signOut, isAuthenticated: !!user };
}
