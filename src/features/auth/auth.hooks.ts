// src/features/auth/auth.hooks.ts

import { useContext } from 'react';
import { AuthContext } from './auth.context';

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error(
            'useAuth() was called outside of AuthProvider. Wrap your component tree with <AuthProvider>.'
        );
    }

    return ctx;
}

// Optional but useful — add more as needed
export function useRole() {
    const { user } = useAuth();
    return user?.role ?? null;
}
