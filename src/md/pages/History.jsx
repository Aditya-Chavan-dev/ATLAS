import React, { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import Card from '../../components/ui/Card'
import {
    Calendar as CalendarIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock
} from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    parseISO,
    getDate
} from 'date-fns'
import { useTheme } from '../../context/ThemeContext'

export default function MDHistory() {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const usersRef = ref(database, 'users')
            const snapshot = await get(usersRef)
            if (snapshot.exists()) {
                // Filter out admins? Keep them if needed, but usually staff only
                const allUsers = Object.values(snapshot.val()).filter(u => u.role !== 'admin')
                setUsers(allUsers)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    // Logic for Calendar Generation
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(parseISO(selectedMonth + '-01')),
        end: endOfMonth(parseISO(selectedMonth + '-01'))
    })

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Helper to get status for a user on a date
    const getStatus = (user, dateObj) => {
        const dateStr = format(dateObj, 'yyyy-MM-dd')
        const record = user.attendance?.[dateStr]

        if (!record) return { type: 'none', label: '-' }

        if (record.status === 'Present') return {
            type: 'present',
            label: 'P',
            time: record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : '',
            loc: record.siteName || record.locationType
        }
        if (record.status === 'Leave' || record.status === 'Absent') return { type: 'absent', label: 'A' }
        if (record.status === 'pending') return { type: 'pending', label: '?' }
        if (record.status === 'Late') return { type: 'late', label: 'L' }

        return { type: 'none', label: '-' }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Register</h1>
                    <p className="text-slate-500 dark:text-slate-400">Master view of all employee attendance history</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                    </div>

                    {/* Month Picker */}
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-950 p-4 font-semibold text-left text-slate-900 dark:text-white min-w-[200px] border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    Employee
                                </th>
                                {daysInMonth.map(day => (
                                    <th key={day.toString()} className="p-2 min-w-[40px] text-center font-medium text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800/50">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] uppercase">{format(day, 'EEEEE')}</span>
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white font-bold' : ''
                                                }`}>
                                                {getDate(day)}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={daysInMonth.length + 1} className="p-8 text-center text-slate-500">
                                        Loading Register...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth.length + 1} className="p-8 text-center text-slate-500">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        {/* Sticky Name Column */}
                                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 p-4 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {user.name?.[0] || 'U'}
                                                </div>
                                                <div className="truncate max-w-[140px]">
                                                    {user.name}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Matrix Cells */}
                                        {daysInMonth.map(day => {
                                            const status = getStatus(user, day)
                                            let cellClass = ''
                                            let textClass = 'text-slate-300 dark:text-slate-700'

                                            if (status.type === 'present') {
                                                cellClass = 'bg-green-50 dark:bg-green-900/20'
                                                textClass = 'text-green-600 dark:text-green-400 font-bold'
                                            } else if (status.type === 'absent') {
                                                cellClass = 'bg-red-50 dark:bg-red-900/20'
                                                textClass = 'text-red-600 dark:text-red-400 font-bold'
                                            } else if (status.type === 'pending') {
                                                cellClass = 'bg-amber-50 dark:bg-amber-900/20'
                                                textClass = 'text-amber-600 dark:text-amber-400 font-bold'
                                            } else if (status.type === 'late') {
                                                cellClass = 'bg-yellow-50 dark:bg-yellow-900/20'
                                                textClass = 'text-yellow-600 dark:text-yellow-400 font-bold'
                                            }

                                            return (
                                                <td key={day.toISOString()} className={`p-1 border-r border-slate-100 dark:border-slate-800/50 text-center relative group/cell ${cellClass}`}>
                                                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs cursor-default ${textClass}`}>
                                                        {status.label}
                                                    </div>

                                                    {/* Tooltip on Hover */}
                                                    {status.type !== 'none' && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block min-w-[120px] bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl z-50 pointer-events-none">
                                                            <div className="font-semibold mb-1">{format(day, 'MMM d')}</div>
                                                            <div className="flex items-center gap-1.5 opacity-90">
                                                                <Clock className="w-3 h-3" />
                                                                {status.time || '-'}
                                                            </div>
                                                            {status.loc && (
                                                                <div className="flex items-center gap-1.5 opacity-90 mt-0.5">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {status.loc}
                                                                </div>
                                                            )}
                                                            <div className="mt-1 capitalize text-blue-300 font-medium border-t border-slate-700 pt-1">
                                                                {status.type}
                                                            </div>
                                                            {/* Arrow */}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                        </div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
