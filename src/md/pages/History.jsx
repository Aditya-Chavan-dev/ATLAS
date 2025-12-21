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
                const s = getStatus(u, day)
                row[format(day, 'MMM d')] = s.type === 'none' ? '-' : s.type.toUpperCase()
            })
            return row
        })
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Attendance")
        XLSX.writeFile(wb, `Attendance_${selectedMonth}.xlsx`)
    }

    return (
        <div className="space-y-6 max-w-full h-full flex flex-col">

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

            {/* Clean List / Matrix View */}
            <Card className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-lg flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow-sm text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                            <tr>
                                <th className="sticky left-0 z-30 bg-white dark:bg-slate-900 p-4 text-left border-b border-slate-100 dark:border-slate-800 min-w-[200px]">Employee</th>
                                {daysInMonth.map(day => (
                                    <th key={day.toString()} className={`p-2 min-w-[36px] text-center border-b border-slate-100 dark:border-slate-800 ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] mb-0.5">{format(day, 'dd')}</span>
                                            <span className="text-[9px] opacity-70">{format(day, 'EEE')[0]}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-center border-b border-slate-100 dark:border-slate-800 min-w-[80px]">Pres</th>
                                <th className="p-4 text-center border-b border-slate-100 dark:border-slate-800 min-w-[80px]">Abs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                            {users.length === 0 ? (
                                <tr><td colSpan="100" className="p-10 text-center text-slate-400">No data found</td></tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const stats = getStats(user)
                                    return (
                                        <tr key={user.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                            {/* Name */}
                                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/30 p-3 pl-4 border-r border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {user.name?.[0]}
                                                    </div>
                                                    <div className="truncate font-medium text-slate-700 dark:text-slate-200 max-w-[120px]" title={user.name}>
                                                        {user.name}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Days */}
                                            {daysInMonth.map(day => {
                                                const s = getStatus(user, day)
                                                const isWknd = isWeekend(day)

                                                return (
                                                    <td key={day.toISOString()} className={`p-1 text-center relative ${isWknd ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''}`}>
                                                        <div className="flex items-center justify-center group/cell">
                                                            {/* Indicator Dot */}
                                                            <span className={`text-xs font-bold ${s.type === 'office' ? 'text-slate-900 dark:text-white' :
                                                                s.type === 'site' ? 'text-slate-900 dark:text-white' :
                                                                    s.type === 'absent' ? 'text-red-500' :
                                                                        s.type === 'leave' ? 'text-orange-500' :
                                                                            s.type === 'pending' ? 'text-yellow-500' :
                                                                                'text-slate-200 dark:text-slate-800'
                                                                }`}>
                                                                {s.type === 'office' ? 'O' :
                                                                    s.type === 'site' ? 'S' :
                                                                        s.type === 'absent' ? 'A' :
                                                                            s.type === 'leave' ? 'L' :
                                                                                s.type === 'pending' ? 'P' : '-'}
                                                            </span>

                                                            {/* Hover Tooltip */}
                                                            {s.type !== 'none' && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50 whitespace-nowrap">
                                                                    <div className="bg-slate-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl flex flex-col items-center">
                                                                        <span className="font-bold">{s.type.toUpperCase()}</span>
                                                                        {s.time && <span className="opacity-80 text-[10px]">{s.time}</span>}
                                                                        {s.loc && <span className="opacity-80 text-[10px]">{s.loc}</span>}
                                                                    </div>
                                                                    <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}

                                            {/* Stats */}
                                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-slate-50/30 dark:bg-slate-800/10">
                                                {stats.p}
                                            </td>
                                            <td className="p-3 text-center font-medium text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/10">
                                                {stats.a}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap gap-8 text-xs font-bold text-slate-600 dark:text-slate-400 justify-center uppercase tracking-wide">
                    <div className="flex items-center gap-2"><span className="text-slate-900 dark:text-white text-sm">O</span> Office</div>
                    <div className="flex items-center gap-2"><span className="text-slate-900 dark:text-white text-sm">S</span> Site</div>
                    <div className="flex items-center gap-2"><span className="text-red-600 text-sm">A</span> Absent</div>
                    <div className="flex items-center gap-2"><span className="text-orange-500 text-sm">L</span> Leave</div>
                    <div className="flex items-center gap-2"><span className="text-yellow-500 text-sm">P</span> Pending</div>
                </div>
            </Card>
        </div>
    )
}
