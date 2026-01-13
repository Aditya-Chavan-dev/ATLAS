// Hook: Manage Users via Realtime Database (Legacy Architecture)
import { useState, useEffect } from 'react';
import { ref, onValue, update, query, orderByChild, limitToFirst } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { database, functions } from '@/lib/firebase/config';
import type { AppUser, UserRole } from '../types/owner.types';

export function useOwnerUsers() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener for all users (Realtime DB)
    useEffect(() => {
        const usersQuery = query(
            ref(database, 'employees'),
            orderByChild('profile/email'),
            limitToFirst(200)
        );

        const unsubscribe = onValue(usersQuery,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const userList = Object.entries(data).map(([uid, val]: [string, any]) => ({
                        uid,
                        email: val.profile?.email || '',
                        displayName: val.profile?.name || val.profile?.fullName || '',
                        photoURL: val.profile?.photoURL || '',
                        role: (val.profile?.role || 'employee') as UserRole,
                        status: (val.profile?.status || 'active') as 'active' | 'suspended' | 'deleted',
                        lastSeen: val.profile?.lastSeen
                    }))
                        .filter(u => u.email && u.email.includes('@'))
                        .filter(u => u.status !== 'deleted'); // Soft delete filter

                    setUsers(userList);
                } else {
                    setUsers([]);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching users from RTDB:", err);
                setError("Failed to load users");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Update Role Function (Secure)
    const updateRole = async (uid: string, newRole: UserRole) => {
        try {
            const setRole = httpsCallable(functions, 'setRole');
            await setRole({ targetUid: uid, newRole });

            // Optimistic update or wait for Listener?
            // Listener will catch it eventually, but let's trust the function.
            return { success: true, message: 'Role updated' };
        } catch (err: any) {
            console.error("Update failed:", err);
            return { success: false, message: err.message };
        }
    };

    // Toggle Status (Suspend/Activate)
    const toggleStatus = async (uid: string, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        try {
            await update(ref(database, `employees/${uid}/profile`), { status: newStatus });
            return { success: true, message: `User ${newStatus}` };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    // Soft Delete
    const deleteUser = async (uid: string) => {
        try {
            await update(ref(database, `employees/${uid}/profile`), { status: 'deleted' });
            return { success: true, message: 'User deleted' };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    return { users, loading, error, updateRole, toggleStatus, deleteUser };
}
