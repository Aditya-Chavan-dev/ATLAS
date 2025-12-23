import React, { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { Link } from 'react-router-dom'
import {
    Users, UserCheck, UserMinus, MapPin,
    Bell, Sun, Moon, Phone, Mail, ArrowRight,
    CheckCircle, Clock, Send
} from 'lucide-react'
import ApiService from '../../services/api'
import { format } from 'date-fns'
import clsx from 'clsx'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ROLES } from '../../config/roleConfig'
import { getEmployeeStats } from '../../utils/employeeStats'
import { getTodayISO } from '../../utils/date'

// UI Components
import MDToast from '../components/MDToast'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

// Utility
const getAvatarColor = (name) => {
    const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    let hash = 0;
    if (!name) return colors[0];
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

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
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
    const [summaryData, setSummaryData] = useState(null)

    // Realtime Data Sync
    useEffect(() => {
        const usersRef = ref(database, 'employees')
        const todayStr = getTodayISO()

        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {}

            // 🔍 CENTRALIZED STATS CALCULATION
            const report = getEmployeeStats(data, todayStr)

            // 🔍 MANDATORY LOGS (Exact Format)
            console.log(`[Dashboard] Raw employees fetched: ${report.rawCount}`)
            console.log(`[Dashboard] Valid employees after role filter: ${report.stats.totalEmployees}`)
            console.log(`[Dashboard] Attendance records for today (${todayStr}): ${report.liveFeed.length}`)
            console.log(`[Dashboard] Counts computed at: ${new Date().toISOString()}`)

            // Log Diagnostics for excluded users
            if (report.feed.length > 0) {
                console.warn('[Dashboard] Excluded Users Diagnostics:', report.feed)
            }

            // Update State (Map utility keys to component keys)
            setEmployees(report.validEmployees)
            setStats({
                total: report.stats.totalEmployees,
                present: report.stats.present,
                onLeave: report.stats.onLeave,
                onSite: report.stats.onsite, // Mapping onsite -> onSite
                absent: report.stats.absent
            })
            setLiveFeed(report.liveFeed.slice(0, 5))
            setLoading(false)

            // 0/0 State Warning
            if (report.stats.totalEmployees === 0 && report.rawCount > 0) {
                console.error('[Dashboard] 🚨 CRITICAL BUG: 0/0 STATE DETECTED! Use diagnostics feed.')
            }
        })

        return () => unsubscribe()
    }, [])




    const handleSendReminderClick = () => {
        setIsReminderModalOpen(true)
    }

    const handleTestNotification = async () => {
        try {
            setToast({ type: 'info', message: 'Sending test... 🧪' })
            const data = await ApiService.post('/api/fcm/test', { uid: currentUser?.uid })
            if (data.success) {
                if (data.results.success > 0) {
                    setToast({ type: 'success', message: `Test Sent! Check your notifications.` })
                } else if (data.results.failure > 0) {
                    setToast({ type: 'error', message: `Test Failed. Google rejected the token.` })
                } else {
                    setToast({ type: 'warning', message: `No devices found for you.` })
                }
            } else {
                setToast({ type: 'error', message: data.error })
            }
        } catch (error) {
            setToast({ type: 'error', message: error.message })
        }
    }

    const confirmSendReminder = async () => {
        setSendingReminder(true)
        try {
            const data = await ApiService.post('/api/fcm/broadcast', { requesterUid: currentUser?.uid })
            if (data.success) {
                // Step 8: Show Summary Modal
                setSummaryData(data.summary)
                setIsReminderModalOpen(false)
                setIsSummaryModalOpen(true)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            setToast({ type: 'error', message: error.message })
            // Keep modal open on error? Or close? Let's keep it open to retry or see error?
            // Usually toast shows error.
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
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
                variants={containerVariants}
            >
                {/* User Count */}
                <MetricCard
                    variants={itemVariants}
                    label="Total Employees"
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
            <div className="flex flex-col lg:flex-row justify-center lg:justify-start gap-4">
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendReminderClick}
                    className="w-full lg:w-auto lg:px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                >
                    <Bell size={20} />
                    <span>Send Attendance Reminder</span>
                </motion.button>

                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTestNotification}
                    className="w-full lg:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    <span className="text-xs uppercase tracking-wider font-bold">Test My Device</span>
                </motion.button>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                title="Send Reminder?"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsReminderModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={confirmSendReminder}
                            loading={sendingReminder}
                            icon={Send}
                        >
                            Send Broadcast
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg flex gap-3">
                        <Bell className="shrink-0 w-5 h-5" />
                        <p className="text-sm">This will trigger a push notification to all employees who have not marked attendance today.</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                        Total Absentees: <b className="text-slate-900 dark:text-white">{stats.absent}</b>
                    </p>
                </div>
            </Modal>

            {/* Step 8: Delivery Summary Modal (Strict Truth Data) - BEAUTIFIED */}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title="Broadcast Results"
                size="lg" // Larger for better visibility
                footer={
                    <Button variant="primary" onClick={() => setIsSummaryModalOpen(false)}>
                        Done
                    </Button>
                }
            >
                {summaryData && (
                    <div className="space-y-6">
                        {/* Top Metrics Banner */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{summaryData.successfullySent}</span>
                                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Received</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-3xl font-bold text-slate-700 dark:text-slate-200">{summaryData.details.notSent.length}</span>
                                    <span className="text-sm font-medium text-slate-400">/ {summaryData.totalEmployees}</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Not Delivered</span>
                            </div>
                        </div>

                        {/* Detailed Breakdowns */}
                        {summaryData.details && (
                            <div className="space-y-6">
                                {/* Success List */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-3 px-1">
                                        <CheckCircle size={16} />
                                        Sent Successfully ({summaryData.details.sent.length})
                                    </h4>
                                    <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/20 rounded-xl overflow-hidden shadow-sm divide-y divide-emerald-50 dark:divide-slate-800">
                                        {summaryData.details.sent.length > 0 ? (
                                            summaryData.details.sent.map((email, i) => {
                                                const user = employees.find(e => e.email?.toLowerCase() === email?.toLowerCase()) || { name: email.split('@')[0], isUnknown: true };
                                                const avatarColor = getAvatarColor(user.name);

                                                return (
                                                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-emerald-50/30 transition-colors">
                                                        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                    {user.isUnknown ? email : user.name}
                                                                </p>
                                                                {user.role && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                                                                        {user.role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!user.isUnknown && (
                                                                <p className="text-xs text-slate-400 font-mono truncate">{email}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-emerald-500">
                                                            <CheckCircle size={16} fill="currentColor" className="text-white" />
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-400 italic">No messages sent.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Failure List */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">
                                        <Bell size={16} className="text-slate-400" />
                                        Not Delivered ({summaryData.details.notSent.length})
                                    </h4>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                                        {summaryData.details.notSent.length > 0 ? (
                                            summaryData.details.notSent.map((email, i) => {
                                                const user = employees.find(e => e.email?.toLowerCase() === email?.toLowerCase()) || { name: email.split('@')[0], isUnknown: true };

                                                return (
                                                    <div key={i} className="flex items-center gap-3 p-3 opacity-75">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                                                                    {user.isUnknown ? email : user.name}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-slate-400 truncate">
                                                                App not installed or notifications blocked
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-400 italic">Everyone received it! 🎉</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-[10px] text-center text-slate-400 px-4">
                            Note: Delivery requires the employee to have the app installed on at least one device.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Today's Summary */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-fit max-w-sm mt-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Today's Summary</h3>
                <div className="space-y-3">
                    <SummaryRow label="Attendance Rate" value={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%`} isCritical={stats.present === 0} />
                    <SummaryRow label="Present" value={`${stats.present} / ${stats.total}`} color="text-emerald-500" />
                    <SummaryRow label="Absent" value={`${stats.total - stats.present - stats.onLeave}`} color="text-red-500" />
                    <SummaryRow label="On Leave" value={stats.onLeave} color="text-amber-500" />
                </div>
            </motion.div>

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
