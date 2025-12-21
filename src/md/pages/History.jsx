import React, { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import Card from '../../components/ui/Card'
import {
    Calendar as CalendarIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
    Filter,
    Download
} from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    parseISO,
    getDate,
    isWeekend
} from 'date-fns'
import * as XLSX from 'xlsx'

export default function MDHistory() {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const usersRef = ref(database, 'users')
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const allUsers = Object.values(snapshot.val()).filter(u => u.role !== 'admin' && u.role !== 'owner')
                setUsers(allUsers)
            } else {
                setUsers([])
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Days Generation
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(parseISO(selectedMonth + '-01')),
        end: endOfMonth(parseISO(selectedMonth + '-01'))
    })

    // Filter Users
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Helper: Get Status
    const getStatus = (user, dateObj) => {
        const dateStr = format(dateObj, 'yyyy-MM-dd')
        const record = user.attendance?.[dateStr]

        if (!record) return { type: 'none' }

        if (record.status === 'Present') {
            return {
                type: record.locationType === 'Office' ? 'office' : 'site',
                time: record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : '',
                loc: record.siteName || record.locationType
            }
        }
        if (record.status === 'Leave') return { type: 'leave' }
        if (record.status === 'Absent') return { type: 'absent' }
        if (record.status === 'pending') return { type: 'pending' }
        if (record.status === 'Late') {
            return {
                type: record.locationType === 'Office' ? 'office' : 'site',
                isLate: true,
                time: record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : '',
                loc: record.siteName || record.locationType
            }
        }
        if (record.status === 'half-day') return { type: 'leave' }

        return { type: 'none' }
    }

    const getStats = (user) => {
        let p = 0, a = 0
        daysInMonth.forEach(day => {
            const s = getStatus(user, day)
            if (s.type === 'office' || s.type === 'site') p++
            if (s.type === 'absent' || s.type === 'leave') a++
        })
        return { p, a }
    }

    // Quick Export for current view
    const handleExport = () => {
        const data = filteredUsers.map(u => {
            const stats = getStats(u)
            const row = {
                'Employee': u.name,
                'Total Present': stats.p,
                'Total Absent': stats.a,
            }
            daysInMonth.forEach(day => {
                const s = getStatus(user, day) // Correction: user -> u
                row[format(day, 'MMM d')] = s.type === 'none' ? '-' : s.type.toUpperCase()
            })
            return row
        })
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Attendance")
        XLSX.writeFile(wb, `Attendance_${selectedMonth}.xlsx`)
    }

    // New Helper: Get Badge Style
    const getBadgeStyle = (type) => {
        switch (type) {
            case 'office': return 'bg-emerald-500 text-white shadow-sm'
            case 'site': return 'bg-blue-600 text-white shadow-sm'
            case 'absent': return 'bg-red-500 text-white shadow-sm'
            case 'leave': return 'bg-amber-400 text-slate-900 shadow-sm'
            case 'pending': return 'bg-slate-400 text-white'
            default: return ''
        }
    }

    return (
        <div className="space-y-4 max-w-full h-full flex flex-col">

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Attendance History
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">{format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto items-start">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64 self-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                    </div>

                    {/* Right Column: Month & Download */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                        {/* Month */}
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium border-none outline-none dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        />

                        {/* Export */}
                        <button
                            onClick={handleExport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none font-medium text-xs"
                        >
                            <Download className="w-3 h-3" />
                            Download Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend - Moved to Top */}
            <div className="flex flex-wrap gap-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500 text-white text-xs font-bold shadow-sm">O</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Office</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 text-white text-xs font-bold shadow-sm">S</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Site</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-red-500 text-white text-xs font-bold shadow-sm">A</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-400 text-slate-900 text-xs font-bold shadow-sm">L</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-slate-400 text-white text-xs font-bold shadow-sm">P</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pending</span>
                </div>
            </div>

            {/* Matrix View */}
            <Card className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-lg flex flex-col rounded-xl">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-sm text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-950 p-4 text-left border-r border-slate-200 dark:border-slate-800 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Employee</th>
                                {daysInMonth.map(day => (
                                    <th key={day.toString()} className={`p-2 min-w-[50px] h-14 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' : ''}`}>
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <span className="text-sm font-bold block">{format(day, 'dd')}</span>
                                            <span className="text-[10px] opacity-70 font-medium">{format(day, 'EEE')}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-center border-l border-slate-200 dark:border-slate-800 min-w-[80px] bg-slate-100/50 dark:bg-slate-900/50 text-emerald-600">Pres</th>
                                <th className="p-4 text-center border-l border-slate-200 dark:border-slate-800 min-w-[80px] bg-slate-100/50 dark:bg-slate-900/50 text-red-500">Abs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {users.length === 0 ? (
                                <tr><td colSpan="100" className="p-10 text-center text-slate-400">No data found</td></tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const stats = getStats(user)
                                    return (
                                        <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                            {/* Name */}
                                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-3 pl-4 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                                                        {user.name?.[0]}
                                                    </div>
                                                    <div className="truncate font-bold text-slate-700 dark:text-slate-200 max-w-[140px]" title={user.name}>
                                                        {user.name}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Days Rendering */}
                                            {daysInMonth.map(day => {
                                                const s = getStatus(user, day)
                                                // Removed subtle highlighting for weekend to focus on status colors

                                                return (
                                                    <td key={day.toISOString()} className="p-1 text-center border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 h-16 w-[50px]">
                                                        <div className="flex items-center justify-center w-full h-full relative group/cell">
                                                            {s.type !== 'none' ? (
                                                                <div className={`
                                                                    w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black transition-transform hover:scale-110 cursor-default
                                                                    ${getBadgeStyle(s.type)}
                                                                `}>
                                                                    {s.type === 'office' ? 'O' :
                                                                        s.type === 'site' ? 'S' :
                                                                            s.type === 'absent' ? 'A' :
                                                                                s.type === 'leave' ? 'L' :
                                                                                    s.type === 'pending' ? 'P' : ''}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-200 dark:text-slate-800 font-light text-xs">-</span>
                                                            )}

                                                            {/* Tooltip */}
                                                            {s.type !== 'none' && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50 whitespace-nowrap pointer-events-none">
                                                                    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl flex flex-col items-center">
                                                                        <span className="font-bold uppercase tracking-wider mb-0.5">{s.type}</span>
                                                                        {s.time && <span className="opacity-80 text-[10px] flex items-center gap-1"><Clock size={10} /> {s.time}</span>}
                                                                        {s.loc && <span className="opacity-80 text-[10px] flex items-center gap-1"><MapPin size={10} /> {s.loc}</span>}
                                                                    </div>
                                                                    <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}

                                            {/* Stats */}
                                            <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm">
                                                    {stats.p}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                                <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 font-bold text-sm">
                                                    {stats.a}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
