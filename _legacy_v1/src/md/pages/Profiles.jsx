import React, { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '@/firebase/config'
import clsx from 'clsx'
import { ArrowLeft } from 'lucide-react'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import logger from '@/utils/logger'

// Sub-components
import ProfileList from '../components/ProfileList'
import ProfileDetail from '../components/ProfileDetail'

export default function MDProfiles() {
    // Standardized "Spigot"
    const { employees, loading } = useEmployees()

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
    const [isMobileListOpen, setIsMobileListOpen] = useState(true) // For mobile nav

    // Auto-select first employee on desktop
    useEffect(() => {
        if (!loading && employees.length > 0 && !selectedEmployeeId) {
            if (window.innerWidth >= 768) {
                // Sort to find the first one alphabetically to match list
                const sorted = [...employees].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                setSelectedEmployeeId(sorted[0].uid)
                setIsMobileListOpen(false)
            }
        }
    }, [loading, employees, selectedEmployeeId])

    const handleSelect = (emp) => {
        setSelectedEmployeeId(emp.uid)
        setIsMobileListOpen(false) // Close list on mobile when selected
    }

    const selectedEmployee = employees.find(e => e.uid === selectedEmployeeId)

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden -m-4 md:-m-8 md:p-8">
            {/* List Panel */}
            <div className={clsx(
                "w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-slate-900 md:rounded-2xl md:ring-1 md:ring-slate-900/5 dark:md:ring-slate-800 shadow-sm overflow-hidden z-20 transition-transform absolute md:relative inset-0 md:inset-auto",
                !isMobileListOpen && "translate-x-full md:translate-x-0"
            )}>
                <ProfileList
                    employees={employees}
                    selectedId={selectedEmployeeId}
                    onSelect={handleSelect}
                />
            </div>

            {/* Detail Panel */}
            <div className="flex-1 bg-white dark:bg-slate-900 md:rounded-2xl md:ring-1 md:ring-slate-900/5 dark:md:ring-slate-800 shadow-sm overflow-hidden relative">
                {/* Mobile Back Button Overlay */}
                {!isMobileListOpen && (
                    <button
                        onClick={() => setIsMobileListOpen(true)}
                        className="md:hidden absolute top-4 left-4 z-30 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full shadow-sm text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <ProfileDetail employee={selectedEmployee} />
            </div>
        </div>
    )
}
