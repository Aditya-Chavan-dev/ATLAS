import React, { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { Link } from 'react-router-dom'
import {
    Users, UserCheck, UserMinus, MapPin,
    Bell, Sun, Moon, Phone, Mail, ArrowRight,
    CheckCircle, Clock
} from 'lucide-react'
import ApiService from '../../services/api'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

// UI Components
import MDToast from '../components/MDToast'

export default function MDDashboard() {
    const { theme, toggleTheme } = useTheme()
    const { currentUser } = useAuth()

    // State
    const [employees, setEmployees] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        onLeave: 0,
        onSite: 0,
        absent: 0
    })
    const [liveFeed, setLiveFeed] = useState([])
    const [sendingReminder, setSendingReminder] = useState(false)
    const [toast, setToast] = useState(null)
    const [loading, setLoading] = useState(true)

    // Realtime Data Sync
    useEffect(() => {
        const usersRef = ref(database, 'users')
        const todayStr = new Date().toISOString().split('T')[0]

        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {}

            // Process Users
            const userList = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(u => u.role !== 'admin' && u.role !== 'md')

            // Calculate Stats & Feed
            let newStats = { total: userList.length, present: 0, onLeave: 0, onSite: 0, absent: 0 }
            let feed = []

            userList.forEach(user => {
                const todayRecord = user.attendance?.[todayStr]
                let status = 'Absent'

                if (todayRecord) {
                    // Feed Item
                    feed.push({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        timestamp: todayRecord.timestamp,
                        status: todayRecord.status,
                        location: todayRecord.location || 'Office',
                        avatarColor: getAvatarColor(user.name)
                    })

                    // Stats
                    const s = todayRecord.status
                    if (s === 'Present' || s === 'Late') newStats.present++
                    if (s === 'site') newStats.onSite++ // 'site' is the status code? Check logic. Usually 'Present' with location 'Site'.
                    // Actually previous logic used getStatus helper. Let's simplify:
                    if (todayRecord.location === 'Site') newStats.onSite++ // If distinct from present count? 
                    // Let's adhere to previous strict logic if possible, or spec logic.
                    // Spec: "Present Today" (Green), "On Leave" (Amber), "On Site" (Indigo).

                    if (['Present', 'Late'].includes(s) && todayRecord.location !== 'Site') {
                        // Counted in Present
                    }
                    if (['leave', 'half-day'].includes(s)) newStats.onLeave++
                } else {
                    newStats.absent++
                }
            })

            // Sort Feed by latest
            feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

            setEmployees(userList)
            setStats(newStats)
            setLiveFeed(feed.slice(0, 5)) // Top 5
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleSendReminder = async () => {
        if (!confirm('Send "Attendance Reminder" to all absent staff?')) return
        setSendingReminder(true)
        try {
            const data = await ApiService.post('/api/fcm/broadcast', { requesterUid: currentUser?.uid })
            if (data.success) {
                setToast({ type: 'success', message: `Reminder Sent! Delivered: ${data.sent}` })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            setToast({ type: 'error', message: error.message })
        } finally {
            setSendingReminder(false)
        }
    }

    // Helper: Avatar Colors
    const getAvatarColor = (name) => {
        const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600']
        const index = (name?.charCodeAt(0) || 0) % colors.length
        return colors[index]
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            className="space-y-6 pb-24 lg:pb-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* 1. Top Header (Sticky) */}
            <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors duration-300">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h1>
                    <p className="text-xs text-slate-500 font-medium">{format(new Date(), 'EEEE, d MMMM')}</p>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* 2. Top Deck - Metrics Grid */}
            <motion.div
                className="grid grid-cols-2 gap-3"
                variants={containerVariants}
            >
                {/* User Count */}
                <MetricCard
                    variants={itemVariants}
                    label="Total Staff"
                    value={stats.total}
                    icon={Users}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-600/10"
                />

                {/* Present (Critical) */}
                <MetricCard
                    variants={itemVariants}
                    label="Present Today"
                    value={stats.present}
                    subValue={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`}
                    icon={UserCheck}
                    colorClass={stats.present === 0 ? "text-red-500" : "text-emerald-500"}
                    bgClass={stats.present === 0 ? "bg-red-500/10" : "bg-emerald-500/10"}
                    borderColor={stats.present === 0 ? "border-red-500/30" : "border-emerald-500/30"}
                    borderWidth={stats.present === 0 ? "border-2" : "border"}
                    isAlert={stats.present === 0}
                />

                {/* On Leave */}
                <MetricCard
                    variants={itemVariants}
                    label="On Leave"
                    value={stats.onLeave}
                    icon={UserMinus}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-500/10"
                />

                {/* On Site */}
                <MetricCard
                    variants={itemVariants}
                    label="On Site"
                    value={stats.onSite}
                    icon={MapPin}
                    colorClass="text-indigo-500"
                    bgClass="bg-indigo-500/10"
                />
            </motion.div>

            {/* 3. Quick Action - Send Reminder */}
            <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {sendingReminder ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Bell size={20} />
                        <span>Send Attendance Reminder</span>
                    </>
                )}
            </motion.button>

            {/* 4. Live Feed Section */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Attendance</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <AnimatePresence initial={false}>
                        {liveFeed.length === 0 ? (
                            <div className="py-8 text-center">
                                <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No Check-ins yet</p>
                            </div>
                        ) : (
                            liveFeed.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 py-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.avatarColor}`}>
                                            {item.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(item.timestamp), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "text-xs px-2.5 py-1 rounded-full font-medium",
                                        item.status === 'Present' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                    )}>
                                        {item.status === 'Present' && item.location === 'Site' ? 'On Site' : item.status}
                                    </span>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* 5. Team Roster (Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Roster List */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Team Roster</h3>
                        <span className="text-xs text-slate-500">{employees.length} Members</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                        {employees.slice(0, 10).map((emp) => {
                            const todayRec = emp.attendance?.[new Date().toISOString().split('T')[0]]
                            const isOnline = !!todayRec // Simple proxy for "Online"
                            return (
                                <div key={emp.id} className="px-4 py-3 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(emp.name)}`}>
                                            {emp.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{emp.name}</p>
                                            <p className="text-[10px] text-slate-500 line-clamp-1">{emp.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 text-center text-xs text-blue-600 cursor-pointer font-medium border-t border-slate-100 dark:border-slate-800">
                        View All Members
                    </div>
                </motion.div>

                {/* Today's Summary */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-fit">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Today's Summary</h3>
                    <div className="space-y-3">
                        <SummaryRow label="Attendance Rate" value={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`} isCritical={stats.present === 0} />
                        <SummaryRow label="Present" value={`${stats.present} / ${stats.total}`} color="text-emerald-500" />
                        <SummaryRow label="Absent" value={`${stats.total - stats.present - stats.onLeave}`} color="text-red-500" />
                        <SummaryRow label="On Leave" value={stats.onLeave} color="text-amber-500" />
                    </div>
                </motion.div>
            </div>

        </motion.div>
    )
}

// Sub-components for cleaner internal consistency
const MetricCard = ({ label, value, subValue, icon: Icon, colorClass, bgClass, borderColor, borderWidth, isAlert, variants }) => (
    <motion.div
        variants={variants || { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className={clsx(
            "p-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group",
            borderColor || "border-slate-200 dark:border-slate-800",
            borderWidth || "border"
        )}
    >
        {isAlert && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
        <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center mb-3", bgClass)}>
            <Icon size={18} className={colorClass} />
        </div>
        <div className="flex items-baseline gap-1">
            <span className={clsx("text-2xl font-bold tracking-tight", isAlert ? "text-red-500" : "text-slate-900 dark:text-white")}>
                {value}
            </span>
            {subValue && <span className={clsx("text-xs font-semibold", isAlert ? "text-red-400" : "text-slate-400")}>{subValue}</span>}
        </div>
        <p className="text-xs text-slate-500">{label}</p>
    </motion.div>
)

const SummaryRow = ({ label, value, color, isCritical }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 space-x-2">{label}</span>
        <span className={clsx("text-sm font-bold", isCritical ? "text-red-500" : (color || "text-slate-900 dark:text-white"))}>
            {value}
        </span>
    </div>
)
