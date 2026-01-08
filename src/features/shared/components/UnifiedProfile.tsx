import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { database } from '@/lib/firebase/config';
import { ref, get, update, onValue } from 'firebase/database';
import {
    User, Mail, Phone, LogOut, Moon, Sun,
    Shield, Terminal, Search, AlertTriangle,
    CheckCircle, XCircle
} from 'lucide-react';

export default function UnifiedProfile() {
    const { user, signOut } = useAuth();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [debugPath, setDebugPath] = useState('');
    const [debugResult, setDebugResult] = useState<any>(null);
    const [debugLoading, setDebugLoading] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // Profile State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    // const [loading, setLoading] = useState(true);

    // 1. Initial Load
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');

        if (user) {
            const unsub = onValue(ref(database, `users/${user.uid}`), (snap) => {
                const data = snap.val();
                if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
                // setLoading(false);
            });
            return () => unsub();
        }
    }, [user]);

    // 2. Theme Toggle
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // 3. Save Profile
    const handleSave = async () => {
        if (!user) return;
        try {
            await update(ref(database, `users/${user.uid}`), { phoneNumber });
            setIsEditing(false);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    // 4. Data Debugger (The "Fix")
    const handleDebug = async () => {
        if (!debugPath) return;
        setDebugLoading(true);
        setDebugResult(null);
        try {
            // Allow user to check "attendance/2026-01-01" or full paths
            const finalPath = debugPath.startsWith('/') ? debugPath.slice(1) : debugPath;
            // console.log(`[Debugger] Probing: ${finalPath}`);

            const snap = await get(ref(database, finalPath));
            if (snap.exists()) {
                setDebugResult({ found: true, data: snap.val() });
            } else {
                setDebugResult({ found: false, message: 'Path is null/empty' });
            }
        } catch (err: any) {
            setDebugResult({ error: true, message: err.message });
        } finally {
            setDebugLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            {/* 1. Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.displayName?.[0] || 'U'
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {user.displayName || 'Atlas User'}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Mail className="w-3 h-3" />
                            {user.email}
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
                    </button>
                </div>
            </div>

            {/* 2. Personal Details */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    Personal Details
                </h3>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                disabled={!isEditing}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all font-medium disabled:opacity-75"
                                placeholder="+91..."
                            />
                        </div>
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
                            >
                                Save
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Account Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Account
                </h3>
                <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>

            {/* 4. Advanced Data Debugger */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-indigo-500 transition-colors"
                >
                    <Terminal className="w-4 h-4" />
                    Advanced Data Debugger
                </button>

                {showDebug && (
                    <div className="mt-4 bg-slate-900 rounded-2xl p-4 font-mono text-sm space-y-3">
                        <div className="text-slate-400 text-xs">
                            Path format: uses/uid, attendance/YYYY-MM-DD/uid
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={debugPath}
                                onChange={e => setDebugPath(e.target.value)}
                                className="flex-1 bg-slate-800 text-green-400 px-3 py-2 rounded-lg border border-slate-700 focus:border-green-500 focus:outline-none"
                                placeholder="attendance/2026-01-07/USER_ID"
                            />
                            <button
                                onClick={handleDebug}
                                disabled={debugLoading}
                                className="px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick User ID Helper */}
                        <div className="flex gap-2 text-xs">
                            <span className="text-slate-500">My UID:</span>
                            <code className="bg-slate-800 text-slate-300 px-1 rounded select-all">{user.uid}</code>
                        </div>

                        {/* Result Display */}
                        {debugResult && (
                            <div className={`p-3 rounded-lg border ${debugResult.error ? 'bg-red-900/20 border-red-900/50' :
                                debugResult.found ? 'bg-green-900/20 border-green-900/50' : 'bg-slate-800 border-slate-700'
                                }`}>
                                <div className="flex items-center gap-2 mb-2 font-bold">
                                    {debugResult.error ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                                        debugResult.found ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                                            <XCircle className="w-4 h-4 text-slate-500" />}
                                    <span className={
                                        debugResult.error ? 'text-red-400' :
                                            debugResult.found ? 'text-green-400' : 'text-slate-400'
                                    }>
                                        {debugResult.error ? 'Read Error' : debugResult.found ? 'Data Found' : 'No Data'}
                                    </span>
                                </div>
                                {debugResult.data && (
                                    <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(debugResult.data, null, 2)}
                                    </pre>
                                )}
                                {debugResult.message && (
                                    <div className="text-xs text-slate-400">{debugResult.message}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
