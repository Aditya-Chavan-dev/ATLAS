import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, CheckSquare, Menu, X } from 'lucide-react';
import { useAuth } from '@/features/auth';

export default function MDLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const useAuthHook = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: CheckSquare, label: 'Approvals', path: '/md' },
    ];

    return (
        // Law #1 & #4: min-h-dvh with mobile slide-over pattern
        <div className="flex min-h-dvh bg-gray-50 font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50
                w-[280px] max-w-[85vw]
                bg-white border-r border-gray-200 shadow-2xl md:shadow-none
                transform transition-transform duration-300 ease-out
                pl-safe-left
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
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">ATLAS</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Director</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium
                                    min-h-[48px]
                                    ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                        : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'}
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 pb-safe-bottom">
                    <button
                        onClick={async () => {
                            await useAuthHook.signOut();
                            navigate('/login');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-rose-100 min-h-[44px]"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30 pt-safe-top">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <CheckSquare className="w-5 h-5 text-white" />
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

                {/* Page Content */}
                <div className="flex-1 overflow-x-hidden p-4 md:p-8 relative w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
