import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

export default function MDNavbar({ toggleSidebar, isMobile }) {
    const location = useLocation()
    const { currentUser } = useAuth()

    const getPageTitle = () => {
        const path = location.pathname
        if (path.includes('dashboard')) return 'Dashboard'
        if (path.includes('approvals')) return 'Approvals'
        if (path.includes('employees')) return 'Team Management'
        if (path.includes('profiles')) return 'Employee Profiles'
        if (path.includes('export')) return 'Export Data'
        return 'Console'
    }

    return (
        <header className="h-16 px-4 md:px-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
            <div className="flex items-center gap-4">
                <span className="p-2 -ml-2 rounded-lg bg-blue-600 text-white font-bold w-10 h-10 flex items-center justify-center shadow-sm">MD</span>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">{getPageTitle()}</h1>
            </div>

            {/* Desktop Search Bar (Placeholder) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800 cursor-pointer">
                    {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                </div>
            </div>
        </header>
    )
}
