import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Users, Settings, LogOut, Shield, Menu } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function OwnerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Users, label: 'Access Control', path: '/owner' },
        { icon: Settings, label: 'Settings', path: '/owner/settings' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative z-50 flex flex-col w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="flex items-center gap-3 p-6 h-16 border-b border-gray-100">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">ATLAS</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Owner</p>
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
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium
                                    ${isActive
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'}
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                {/* Top Header (Mobile Only) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-base font-bold text-slate-900">ATLAS</h1>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-slate-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 relative">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
