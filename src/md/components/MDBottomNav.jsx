import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckCircle, Users, User, Download } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
    { name: 'Home', href: '/md/dashboard', icon: Home },
    { name: 'Approvals', href: '/md/approvals', icon: CheckCircle },
    { name: 'Team', href: '/md/employees', icon: Users },
    { name: 'Profiles', href: '/md/profiles', icon: User },
    { name: 'Export', href: '/md/export', icon: Download }
]

export default function MDBottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
            <div className="flex justify-around items-center h-16 md:h-18 max-w-2xl mx-auto px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center justify-center w-full h-full py-1 space-y-1 transition-colors duration-200 tap-highlight-transparent",
                            isActive
                                ? "text-blue-600 dark:text-blue-500"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={clsx(
                                    "p-1.5 rounded-xl transition-all duration-300",
                                    isActive && "bg-blue-50 dark:bg-blue-900/20 transform -translate-y-1"
                                )}>
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={clsx(
                                    "text-[10px] font-medium transition-all duration-300",
                                    isActive ? "opacity-100 font-bold" : "opacity-0 h-0 hidden md:block md:opacity-100 md:h-auto"
                                )}>
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
