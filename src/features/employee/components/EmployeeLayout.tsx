import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, User, Menu, Briefcase, LogOut, X } from 'lucide-react';
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
        // Law #1: min-h-dvh (Mobile first)
        <div className="flex min-h-dvh bg-gray-50 font-sans">
            {/* Mobile Sidebar Overlay (Backdrop) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Mobile: Slide-over | Desktop: Static */}
            <aside className={`
                fixed inset-y-0 left-0 z-50
                w-[280px] max-w-[85vw]
                bg-white border-r border-gray-200 shadow-2xl md:shadow-none
                transform transition-transform duration-300 ease-out
                pl-safe-left /* Safe Area Law */
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:z-auto
                flex flex-col
            `}>
                {/* Close Button - Mobile Only */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-slate-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Brand */}
                <div className="flex items-center gap-3 p-6 h-20 border-b border-gray-100 flex-shrink-0">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-200">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">ATLAS</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Employee</p>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
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
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium
                                    min-h-[48px] /* Touch Target Law */
                                    ${isActive
                                        ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200'
                                        : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'}
                                `}
                            >
                                <tab.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3 pb-safe-bottom">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                            ME
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">My Account</p>
                            <p className="text-xs text-slate-500 truncate">Logged In</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await useAuthHook.signOut();
                            navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-rose-100 min-h-[44px]"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30 pt-safe-top">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">ATLAS</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-slate-500 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Dynamic Content Container */}
                {/* overflow-x-hidden is critical for preventing horizontal scroll */}
                <div className="flex-1 w-full overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
