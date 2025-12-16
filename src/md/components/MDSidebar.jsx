import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, CheckCircle, Users, User, Download, LogOut, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';

const NavigationItems = [
    { name: 'Dashboard', href: '/md/dashboard', icon: Home },
    { name: 'Approvals', href: '/md/approvals', icon: CheckCircle },
    { name: 'Team', href: '/md/employees', icon: Users },
    { name: 'Profiles', href: '/md/profiles', icon: User },
    { name: 'Export', href: '/md/export', icon: Download },
];

const MDSidebar = ({ isOpen, setIsOpen, isMobile, onCloseMobile }) => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 z-50 h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col",
                    "transition-[width,transform] duration-300 ease-in-out will-change-[width,transform]",
                    isOpen ? "w-64" : "w-[72px]",
                    isMobile && !isOpen && "-translate-x-full"
                )}
            >
                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                    <div className={clsx("flex items-center gap-3 overflow-hidden transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 w-0")}>
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap">Atlas Console</span>
                    </div>

                    {/* Toggle Button (Desktop only) */}
                    {!isMobile && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        >
                            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {NavigationItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={isMobile ? onCloseMobile : undefined}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon size={22} className={clsx("shrink-0 transition-colors", isOpen ? "" : "mx-auto")} />

                            <span className={clsx(
                                "transition-opacity duration-300 whitespace-nowrap overflow-hidden",
                                isOpen ? "opacity-100 delay-100" : "opacity-0 w-0"
                            )}>
                                {item.name}
                            </span>

                            {/* Tooltip for collapsed state */}
                            {!isOpen && !isMobile && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    {item.name}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                            !isOpen && "justify-center"
                        )}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                        <span className={clsx("transition-opacity duration-300 overflow-hidden whitespace-nowrap", isOpen ? "opacity-100 delay-75" : "opacity-0 w-0")}>
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                            !isOpen && "justify-center"
                        )}
                        title="Sign Out"
                    >
                        <LogOut size={22} />
                        <span className={clsx("transition-opacity duration-300 overflow-hidden whitespace-nowrap", isOpen ? "opacity-100 delay-75" : "opacity-0 w-0")}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default MDSidebar;
