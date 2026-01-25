import { useAuth, useUserProfile } from '@/features/auth';
import { LogOut, Mail, User } from 'lucide-react';

export default function EmployeeProfile() {
    const { user, signOut } = useAuth();
    const { profile } = useUserProfile();

    const displayName = profile?.name || user?.displayName || 'Employee';
    const email = profile?.email || user?.email || 'No Email';
    const photoURL = user?.photoURL;

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] p-6 space-y-8 bg-slate-50">
            {/* 1. Big Identity Card */}
            <div className="flex flex-col items-center justify-center space-y-4 pt-10">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg border-4 border-white">
                    {photoURL ? (
                        <img src={photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center text-4xl font-bold text-brand-600">
                            {displayName[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
                        <Mail className="w-4 h-4" />
                        <span>{email}</span>
                    </div>
                    {profile?.role && (
                        <div className="flex items-center justify-center gap-2 text-brand-600 font-bold uppercase tracking-widest text-xs pt-1">
                            <User className="w-3 h-3" />
                            <span>{profile.role}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Action Zone */}
            <div className="flex-1 flex flex-col justify-end pb-8">
                <button
                    onClick={signOut}
                    className="w-full py-4 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-bold text-lg shadow-sm hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <LogOut className="w-6 h-6" />
                    Sign Out
                </button>
                <div className="text-center mt-6 text-xs text-slate-400 font-mono">
                    Version 1.0.0 (Mobile)
                </div>
            </div>
        </div>
    );
}

