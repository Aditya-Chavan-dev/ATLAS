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
        const todayStr = new Date().toISOString().split('T')[0]

        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {}

            // Process Users
            const userList = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .filter(u => {
                    const profile = u.profile || u;
                    // Strict Filter: Must have email AND phone
                    return (
                        profile.role !== 'admin' &&
                        profile.role !== 'md' &&
                        profile.email &&
                        profile.phone
                    );
                })

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
                        name: user.profile?.name,
                        email: user.profile?.email,
                        timestamp: todayRecord.timestamp,
                        status: todayRecord.status,
                        location: todayRecord.location || 'Office',
                        avatarColor: getAvatarColor(user.profile?.name)
                    })

                    // Stats
                    const s = todayRecord.status
                    if (s === 'Present' || s === 'Late') newStats.present++
                    if (s === 'site' || todayRecord.location === 'Site') newStats.onSite++

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




    const handleSendReminderClick = () => {
        setIsReminderModalOpen(true)
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
            <div className="flex justify-center lg:justify-start">
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

            {/* Step 8: Delivery Summary Modal (Strict Truth Data) */}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title="Broadcast Report"
                footer={
                    <Button variant="primary" onClick={() => setIsSummaryModalOpen(false)}>
                        Close Report
                    </Button>
                }
            >
                {summaryData && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Delivery Metrics</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 dark:text-slate-300">Total Employees</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{summaryData.totalEmployees}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 -mt-1">Excluding MD and Admin</p>
                                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-600 font-medium">Notifications Sent To</span>
                                    <span className="font-bold text-blue-600">{summaryData.sentTo}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 -mt-2">Employees with App Installed (Permission ON or OFF)</p>

                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-emerald-600" />
                                        <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">Successfully Sent</span>
                                    </div>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{summaryData.successfullySent}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Failed (App not installed)</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">{summaryData.failedNotInstalled}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-amber-600 dark:text-amber-500">Couldn't Reach (Notifications OFF)</span>
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-500">{summaryData.permissionDenied}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-center text-slate-400">
                            Metrics are based on verified device tokens and permission states.
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
