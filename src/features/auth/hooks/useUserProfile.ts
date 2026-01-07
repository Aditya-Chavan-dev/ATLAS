import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from './useAuth';
import type { AppUser } from '@/features/owner/types/owner.types';

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        // Listen to profile in Realtime Database
        const profileRef = ref(database, `employees/${user.uid}/profile`);
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile({
                    uid: user.uid,
                    email: data.email || user.email || '',
                    displayName: data.name || data.fullName || user.displayName || '',
                    photoURL: data.photoURL || user.photoURL || '',
                    role: data.role || 'employee',
                    status: data.status || 'active',
                    lastSeen: data.lastSeen
                } as AppUser);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { profile, loading };
}
