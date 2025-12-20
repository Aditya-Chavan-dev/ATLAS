import React, { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { Link } from 'react-router-dom'
import {
    Users, UserCheck, UserMinus, MapPin,
    ArrowRight, Bell, Calendar as CalendarIcon,
    LayoutGrid, List as ListIcon, Sun, Moon
} from 'lucide-react'
import ApiService from '../../services/api'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

// UI Components
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import MDToast from '../components/MDToast'

export default function MDDashboard() {
    const { theme, toggleTheme } = useTheme()
    const { currentUser } = useAuth()
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        onLeave: 0,
        onSite: 0
    })
    const [employees, setEmployees] = useState([])
    const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
    const [loading, setLoading] = useState(true)
    const [sendingReminder, setSendingReminder] = useState(false)
    const [pendingRequests, setPendingRequests] = useState([])
    const [toast, setToast] = useState(null)

    useEffect(() => {
        const usersRef = ref(database, 'users')

        // Fetch Data
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {}

            // 1. Employee List
            const userList = Object.entries(data).map(([id, val]) => ({
                id,
                ...val
            })).filter(u => u.role !== 'admin')
            setEmployees(userList)

            // 2. Pending Requests
            const allPending = []
            Object.entries(data).forEach(([uid, user]) => {
                if (user.attendance) {
                    Object.entries(user.attendance).forEach(([date, record]) => {
                        if (record.status === 'pending') {
                            allPending.push({
                                id: date,
                                uid,
                                name: user.name || 'Unknown',
                                ...record,
                                type: 'Attendance'
                            })
                        }
                    })
                }
            })
            // Sort by timestamp if available
            allPending.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
            setPendingRequests(allPending.slice(0, 5)) // Top 5
        })

        setLoading(false)

        return () => {
            unsubscribeUsers()
        }
    }, [])

    // Derived Stats (Realtime Calculation)
    useEffect(() => {
        if (employees.length === 0) {
            setStats({ total: 0, present: 0, onLeave: 0, onSite: 0 })
            return
        }

        const todayStr = new Date().toISOString().split('T')[0]
        let present = 0
        let onLeave = 0
        let onSite = 0

        employees.forEach(emp => {
            const todayRecord = emp.attendance?.[todayStr]
            if (todayRecord) {
                if (todayRecord.status === 'Present') present++
                if (todayRecord.status === 'Absent' || todayRecord.status === 'Leave') onLeave++
                if (todayRecord.locationType === 'Site') onSite++
            }
        })

        setStats({
            total: employees.length,
            present,
            onLeave,
            onSite
        })
    }, [employees])


    const handleSendReminder = async () => {
        if (!confirm('CONFIRM BROADCAST: Send "Attendance Reminder" to ALL active employees?')) return

        setSendingReminder(true)
        try {
            const data = await ApiService.post('/api/fcm/broadcast', { requesterUid: currentUser?.uid })

            if (data.success) {
                // Spec 8.1 Final Metrics Display
                const msg = `Broadcast Sent! \nDelivered: ${data.sent} \nFailed: ${data.failures} \nPruned: ${data.pruned}`
                setToast({ type: 'success', message: msg, duration: 8000 })
            } else {
                throw new Error(data.error || 'Broadcast Rejected')
            }
        } catch (error) {
            console.error("Broadcast Logic Failure:", error)
            setToast({ type: 'error', message: `CRITICAL FAILURE: ${error.message}` })
        } finally {
            setSendingReminder(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto">
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header: Date & Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {format(new Date(), 'EEEE, d MMMM yyyy')}
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md transition-all active:scale-95"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <Button
                        variant="primary"
                        className="bg-brand-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        icon={Bell}
                        loading={sendingReminder}
                        onClick={handleSendReminder}
                    >
                        Send Reminder
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Staff"
                    value={stats.total}
                    icon={Users}
                    color="blue"
                // trend="+2 new" // Removed hardcoded trend
                />
                <StatsCard
                    title="Present Today"
                    value={stats.present}
                    icon={UserCheck}
                    color="emerald"
                    trend={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`}
                />
                <StatsCard
                    title="On Leave"
                    value={stats.onLeave}
                    icon={UserMinus}
                    color="amber"
                />
                <StatsCard
                    title="On Site"
                    value={stats.onSite}
                    icon={MapPin}
                    color="indigo"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column: Live Status Feed (2/3 width) */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Live Attendance</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400")}
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400")}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Employee List/Grid */}
                    <div className={clsx(
                        "grid gap-3 transition-all",
                        viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1"
                    )}>
                        {employees.map((emp, i) => (
                            <EmployeeStatusCard key={emp.id || i} employee={emp} viewMode={viewMode} />
                        ))}
                    </div>
                </div>

                {/* Right Column: Pending Actions & Quick Links (1/3 width) */}
                <div className="space-y-6">

                    {/* Pending Approvals Widget */}
                    <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Pending Requests</h3>
                            {pendingRequests.length > 0 && (
                                <Badge variant="warning" className="animate-pulse">{pendingRequests.length} New</Badge>
                            )}
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {/* Real Pending Items */}
                            {pendingRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No pending requests</div>
                            ) : (
                                pendingRequests.map((item, i) => (
                                    <Link key={i} to="/md/approvals" className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-medium text-sm text-slate-900 dark:text-slate-200">{item.name}</div>
                                            <span className="text-xs text-slate-400">
                                                {item.timestamp ? format(new Date(item.timestamp), 'h:mm a') : 'Today'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                                            {item.locationType === 'Site' ? `Site: ${item.siteName}` : 'Marked at Office'}
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">Pending Approval</Badge>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                            <Link to="/md/approvals" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
                                Review All Requests <ArrowRight size={14} />
                            </Link>
                        </div>
                    </Card>

                    {/* Quick Access */}
                    <Card className="p-5 border border-slate-200 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Access</h3>
                        <div className="space-y-3">
                            <Link to="/md/profiles" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group bg-white dark:bg-slate-900 shadow-sm hover:shadow-md">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-slate-900 dark:text-slate-200">View Profiles</div>
                                    <div className="text-xs text-slate-500">Access employee details</div>
                                </div>
                            </Link>
                            <Link to="/md/export" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group bg-white dark:bg-slate-900 shadow-sm hover:shadow-md">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <CalendarIcon size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-slate-900 dark:text-slate-200">Export Report</div>
                                    <div className="text-xs text-slate-500">Download monthly attendance</div>
                                </div>
                            </Link>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    )
}

// Sub-components

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    }

    return (
        <Card className="p-5 flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-2">
                <div className={clsx("p-3 rounded-2xl", colorClasses[color])}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">{trend}</span>
                )}
            </div>
            <div className="mt-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
            </div>
        </Card>
    )
}

const EmployeeStatusCard = ({ employee, viewMode }) => {
    // Realtime Status Logic
    const todayStr = new Date().toISOString().split('T')[0]
    const todayRecord = employee.attendance?.[todayStr]

    const status = todayRecord ? todayRecord.status : 'Offline'
    const statusColor = todayRecord ?
        (todayRecord.status === 'Present' ? 'success' : 'warning') : 'default'
    const time = todayRecord ? new Date(todayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'

    if (viewMode === 'grid') {
        return (
            <Card className="p-4 flex flex-col items-center gap-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group text-center bg-white dark:bg-slate-900">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                    {employee.name?.[0] || 'U'}
                </div>
                <div className="w-full">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm truncate w-full">{employee.name}</div>
                    <Badge variant={statusColor} className="mt-1.5 text-[10px] px-1.5">{status}</Badge>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-3.5 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                    {employee.name?.[0] || 'U'}
                </div>
                <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{employee.name}</div>
                    <div className="text-xs text-slate-500">{employee.email}</div>
                </div>
            </div>
            <div className="flex items-end flex-col gap-1">
                <Badge variant={statusColor}>{status}</Badge>
                {todayRecord && (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{time}</span>
                )}
            </div>
        </Card>
    )
}
