import { useState, useEffect } from 'react';
import SharedProfile from '@/features/shared/components/SharedProfile';
import { useAuth } from '@/features/auth';
import { database } from '@/lib/firebase/config';
import { ref, onValue, update } from 'firebase/database';

export default function EmployeeProfile() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const userRef = ref(database, `users/${user.uid}`);

        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setProfileData(snapshot.val());
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSave = async (newData: any) => {
        if (!user) return;
        const updates: any = {};
        if (newData.displayName) updates[`users/${user.uid}/displayName`] = newData.displayName;
        if (newData.phoneNumber) updates[`users/${user.uid}/phoneNumber`] = newData.phoneNumber;

        // Don't allow employees to change designation/department themselves in real app usually, 
        // but for now allowing if passed, or we restrict it in UI component (SharedProfile logic).
        // For now, SharedProfile sends what is edited.

        await update(ref(database), updates);
    };

    if (loading) return <div className="p-8 text-slate-400">Loading profile...</div>;

    return (
        <SharedProfile
            userData={profileData}
            isEditable={true}
            onSave={handleSave}
        />
    );
}
