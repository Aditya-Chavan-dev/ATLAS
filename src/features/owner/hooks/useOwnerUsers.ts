import { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase/config';
import { ref, update, query, orderByChild, limitToFirst, get } from 'firebase/database';

export interface Employee {
    uid: string;
    name?: string;
    fullName?: string;
    email: string;
    role?: string;
    status?: string;
    photoURL?: string;
}

export function useOwnerUsers() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load Employees
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const usersRef = ref(database, 'employees');
                const q = query(usersRef, orderByChild('profile/email'), limitToFirst(500));

                const snapshot = await get(q);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const empList = Object.entries(data).map(([uid, val]: [string, any]) => ({
                        uid,
                        ...val.profile, // Flatten profile
                        status: val.profile?.status || 'active'
                    })).filter(e => e.email);

                    setEmployees(empList);
                }
            } catch (err) {
                console.error("Failed to load users", err);
                setError("Failed to load users");
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, []);

    // Update Role
    const updateRole = async (uid: string, newRole: string) => {
        try {
            await update(ref(database, `employees/${uid}/profile`), { role: newRole });
            setEmployees(prev => prev.map(e => e.uid === uid ? { ...e, role: newRole } : e));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    // Bulk Update
    const bulkUpdateRole = async (uids: string[], newRole: string) => {
        const updates: any = {};
        uids.forEach(uid => {
            updates[`employees/${uid}/profile/role`] = newRole;
        });

        try {
            await update(ref(database), updates);
            setEmployees(prev => prev.map(e => uids.includes(e.uid) ? { ...e, role: newRole } : e));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return { employees, loading, error, updateRole, bulkUpdateRole };
}
