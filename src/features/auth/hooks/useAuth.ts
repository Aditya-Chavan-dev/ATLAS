// Auth Hook - Authentication State Management
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, update, serverTimestamp, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase/config';
import { authService } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                // ✅ Intelligent Profile Sync (Non-destructive)
                try {
                    const userRef = ref(database, `employees/${user.uid}/profile`);
                    const snapshot = await get(userRef);

                    if (!snapshot.exists()) {
                        // NEW USER: Initialize with default role
                        // 🚨 Force Owner Role for specific email
                        const initialRole = user.email === 'adityagchavan3@gmail.com' ? 'owner' : 'employee';

                        await update(userRef, {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || '',
                            photoURL: user.photoURL || '',
                            role: initialRole,
                            status: 'active',
                            createdAt: serverTimestamp(),
                            lastLogin: serverTimestamp()
                        });
                    } else {
                        // EXISTING USER: Sync metadata but PRESERVE Role & Status
                        // 🚨 Exception: If it's the main owner, FORCE 'owner' role to fix any past mistakes
                        const currentRole = snapshot.val().role;
                        const finalRole = user.email === 'adityagchavan3@gmail.com' ? 'owner' : currentRole;

                        await update(userRef, {
                            email: user.email, // Keep email synced
                            name: user.displayName || snapshot.val().name || '',
                            photoURL: user.photoURL || snapshot.val().photoURL || '',
                            role: finalRole, // Apply role fix if needed
                            lastLogin: serverTimestamp()
                        });
                    }
                } catch (err) {
                    console.error("Profile sync failed:", err);
                }
            }

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
