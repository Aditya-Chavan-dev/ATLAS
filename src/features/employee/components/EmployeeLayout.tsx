import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, User, Menu, Briefcase, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth';

export default function EmployeeLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const useAuthHook = useAuth();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: Home, path: '/employee/dashboard' },
        { id: 'history', label: 'History', icon: Calendar, path: '/employee/history' },
        { id: 'leave', label: 'Leave', icon: FileText, path: '/employee/leave' },
        { id: 'profile', label: 'Profile', icon: User, path: '/employee/profile' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative z-50 flex flex-col w-64 h-full bg-slate-900 text-white transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="flex items-center gap-3 p-6 border-b border-white/10">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">ATLAS</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">EMPLOYEE</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {tabs.map((tab) => {
                        const isActive = location.pathname.includes(tab.path);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    navigate(tab.path);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-medium'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                <span className="text-sm">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">ME</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">My Account</p>
                            <p className="text-xs text-slate-400 truncate">Employee</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await useAuthHook.signOut();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                {/* Top Header (Mobile Only) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-30">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-slate-800">ATLAS</h1>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
