import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, CheckSquare, Menu } from 'lucide-react';
import { useAuth } from '@/features/auth';

export default function MDLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const useAuthHook = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: CheckSquare, label: 'Approvals', path: '/md' },
        // Add more MD specific items later like Reports
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
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">ATLAS</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">MD PORTAL</p>
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
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 font-medium'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50">
                    <button
                        onClick={async () => {
                            await useAuthHook.signOut();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-400" />
                        <span className="text-sm font-medium">Sign Out</span>
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
