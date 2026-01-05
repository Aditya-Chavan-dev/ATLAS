import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => authService.onAuthStateChange(u => {
        setUser(u);
        setLoading(false);
    }), []);

    const handleAuth = async (action: () => Promise<void>) => {
        setLoading(true);
        setError(null);
        try { await action(); }
        catch (e: any) { setError(e.message); throw e; }
        finally { setLoading(false); }
    };

    return {
        user, loading, error,
        isAuthenticated: !!user,
        signIn: () => handleAuth(async () => { setUser(await authService.signInWithGoogle()); }),
        signOut: () => handleAuth(async () => { await authService.signOut(); setUser(null); })
    };
}
