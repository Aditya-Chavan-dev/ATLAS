import React, { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'

export default function ProfileList({
    employees,
    onSelect,
    selectedId,
    className
}) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            (emp.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (emp.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )
    }, [employees, searchQuery])

    return (
        <div className={clsx("flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800", className)}>
            {/* Search Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search profiles..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredEmployees.map(emp => (
                    <button
                        key={emp.uid}
                        onClick={() => onSelect(emp)}
                        className={clsx(
                            "w-full text-left p-4 flex items-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50",
                            selectedId === emp.uid && "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30"
                        )}
                    >
                        {/* Avatar */}
                        <div className={clsx(
                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors shrink-0",
                            selectedId === emp.uid
                                ? "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-100"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                            {emp.name?.[0]?.toUpperCase() || 'U'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className={clsx(
                                "font-semibold truncate",
                                selectedId === emp.uid ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white"
                            )}>
                                {emp.name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                        </div>

                        {/* Arrow indicator for active */}
                        {selectedId === emp.uid && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                    </button>
                ))}

                {filteredEmployees.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No profiles found.
                    </div>
                )}
            </div>
        </div>
    )
}
