import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Clock, ArrowRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { clsx } from 'clsx'

export default function ProfileList({ employees, selectedId, onSelect, searchTerm, setSearchTerm }) {

    // Filter employees based on search
    const filtered = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence>
                    {filtered.map((emp) => {
                        const isSelected = selectedId === emp.uid
                        return (
                            <motion.div
                                key={emp.uid}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                <div
                                    onClick={() => onSelect(emp.uid)}
                                    className={clsx(
                                        "p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                                        isSelected
                                            ? "bg-brand-light border-brand-primary/30 shadow-sm"
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors",
                                            isSelected ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {(emp.name || 'U').charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className={clsx(
                                                    "font-semibold truncate",
                                                    isSelected ? "text-brand-dark" : "text-slate-800"
                                                )}>
                                                    {emp.name || 'Unknown'}
                                                </h3>
                                                {isSelected && <ArrowRight className="w-4 h-4 text-brand-primary" />}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{emp.email}</p>

                                            {/* Status Line */}
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <div className={clsx(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        emp.present > 0 ? "bg-emerald-500" : "bg-slate-300"
                                                    )} />
                                                    <span>{emp.present > 0 ? 'Present' : 'Absent'}</span>
                                                </div>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{emp.lastSeen ? new Date(emp.lastSeen).toLocaleDateString() : 'Never'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No employees found.</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500 font-medium">
                {filtered.length} Employees
            </div>
        </div>
    )
}
