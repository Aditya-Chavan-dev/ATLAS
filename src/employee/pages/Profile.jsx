import { useState, useRef, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import RefinedModal from '../../components/ui/RefinedModal'
import {
    BellIcon,
    MoonIcon,
    SunIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function Profile() {
    const { currentUser, userProfile, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 })
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        resolve: null // Promise resolver for async confirmation
    })

    // Calculate Stats for Current Month
    useEffect(() => {
        if (!currentUser) return
        const currentMonth = new Date().toISOString().slice(0, 7)
        const attendanceRef = ref(database, `users/${currentUser.uid}/attendance`)
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                let s = { present: 0, late: 0, absent: 0 }
                Object.entries(data).forEach(([date, record]) => {
                    if (date.startsWith(currentMonth)) {
                        const recStatus = record.status?.toLowerCase().trim() || ''
                        if (['present', 'approved', 'office', 'site', 'on time'].includes(recStatus)) s.present++
                        else if (['late'].includes(recStatus)) s.late++
                        else if (['absent', 'rejected'].includes(recStatus)) s.absent++
                    }
                })
                setStats(s)
            }
        })
        return () => unsubscribe()
    }, [currentUser])

    const showConfirm = (title, message, type = 'warning') => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                message,
                type,
                primaryAction: {
                    label: 'Confirm',
                    onClick: () => {
                        resolve(true)
                        setModalConfig(prev => ({ ...prev, isOpen: false }))
                    }
                },
                secondaryAction: {
                    label: 'Cancel',
                    onClick: () => {
                        resolve(false)
                        setModalConfig(prev => ({ ...prev, isOpen: false }))
                    }
                },
                onClose: () => {
                    resolve(false)
                    setModalConfig(prev => ({ ...prev, isOpen: false }))
                }
            })
        })
    }

    // Local state for optimistic updates
    const [localNotificationState, setLocalNotificationState] = useState(userProfile?.notificationsEnabled || false)

    // Sync local state with backend when it changes
    useEffect(() => {
        if (userProfile) {
            setLocalNotificationState(userProfile.notificationsEnabled || false)
        }
    }, [userProfile?.notificationsEnabled])

    const handleNotificationToggle = async () => {
        const newState = !localNotificationState
        // Optimistic Update
        setLocalNotificationState(newState)
        setLoading(true)

        try {
            if (!newState) {
                // Turn OFF
                const confirmed = await showConfirm(
                    'Disable Notifications?',
                    'You will no longer receive push notifications for attendance reminders.',
                    'warning'
                )
                if (confirmed) {
                    await import('../../services/fcm').then(mod => mod.removeNotificationToken(currentUser.uid))
                    setToast({ message: 'Notifications disabled', type: 'success' })
                } else {
                    // Revert if cancelled
                    setLocalNotificationState(true)
                }
            } else {
                // Turn ON
                const token = await import('../../services/fcm').then(mod => mod.requestNotificationPermission(currentUser.uid))
                if (token) {
                    setToast({ message: 'Notifications enabled!', type: 'success' })
                } else {
                    setToast({ message: 'Permission denied or failed to enable.', type: 'error' })
                    // Revert on failure
                    setLocalNotificationState(false)
                }
            }
        } catch (error) {
            console.error(error)
            setToast({ message: 'Failed to update settings.', type: 'error' })
            // Revert on error
            setLocalNotificationState(!newState)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        const confirmed = await showConfirm(
            'Sign Out',
            'Are you sure you want to log out of ATLAS?',
            'warning'
        )
        if (confirmed) await logout()
    }

    const menuItems = [
        {
            icon: BellIcon,
            label: 'Notifications',
            type: 'toggle',
            value: localNotificationState,
            action: handleNotificationToggle
        },
        {
            icon: theme === 'dark' ? SunIcon : MoonIcon,
            label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
            action: toggleTheme,
            type: 'custom_toggle'
        },
        {
            icon: ArrowRightOnRectangleIcon,
            label: 'Sign Out',
            color: 'text-red-600 dark:text-red-400',
            action: handleLogout
        }
    ]

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300 overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                primaryAction={modalConfig.primaryAction}
                secondaryAction={modalConfig.secondaryAction}
            />

            {/* Compact Header / ID Card */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-colors">
                <div className="shrink-0 w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {userProfile?.photoURL || currentUser?.photoURL ? (
                        <img src={userProfile?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xl font-bold">
                            {userProfile?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{userProfile?.name || 'Employee'}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile?.role || 'Staff Member'}</p>
                    <div className="mt-1 inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        #{currentUser?.uid?.slice(0, 6).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="shrink-0 mt-4 mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Overview</h3>
                <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Present" value={stats.present} type="present" compact={true} />
                    <StatCard label="Late" value={stats.late} type="late" compact={true} />
                    <StatCard label="Absent" value={stats.absent} type="absent" compact={true} />
                </div>
            </div>

            {/* Settings Menu - Scrollable Area */}
            <div className="flex-1 mt-2 min-h-0 flex flex-col">
                <h3 className="shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Settings</h3>
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800 shadow-sm overflow-y-auto">
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={item.action}
                            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${item.color || 'text-slate-500 dark:text-slate-400'}`} />
                                <span className={`text-sm font-medium ${item.color || 'text-slate-700 dark:text-slate-200'}`}>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.type === 'custom_toggle' && (
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'left-4.5 translate-x-0' : 'left-0.5'}`} style={{ left: theme === 'dark' ? '1.1rem' : '0.125rem' }} />
                                    </div>
                                )}
                                {item.type === 'toggle' && (
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${item.value ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${item.value ? 'left-4.5 translate-x-0' : 'left-0.5'}`} style={{ left: item.value ? '1.1rem' : '0.125rem' }} />
                                    </div>
                                )}
                                {(item.type !== 'custom_toggle' && item.type !== 'toggle') && (
                                    <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                <p className="shrink-0 text-center text-[10px] text-slate-300 dark:text-slate-600 mt-4 mb-2">ATLAS Enterprise v1.0.0</p>
            </div>
        </div>
    )
}
