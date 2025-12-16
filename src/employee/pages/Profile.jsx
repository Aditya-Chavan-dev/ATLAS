// Enterprise Profile
import { useState, useRef, useEffect } from 'react'
import { ref, update, onValue } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
    CameraIcon,
    BellIcon,
    LanguageIcon,
    QuestionMarkCircleIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'

export default function Profile() {
    const { currentUser, userProfile, logout } = useAuth()
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 })
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const fileInputRef = useRef(null)

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
                        if (record.status === 'Present') s.present++
                        else if (record.status === 'Late') s.late++
                        else if (record.status === 'Absent') s.absent++
                    }
                })
                setStats(s)
            }
        })
        return () => unsubscribe()
    }, [currentUser])

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Basic validation
        if (file.size > 2 * 1024 * 1024) {
            setToast({ message: 'Image must be under 2MB', type: 'error' })
            return
        }

        setLoading(true)
        try {
            // Upload to Storage
            const fileRef = storageRef(storage, `profiles/${currentUser.uid}_${Date.now()}`)
            await uploadBytes(fileRef, file)
            const photoURL = await getDownloadURL(fileRef)

            // Update Auth & DB
            await updateProfile(currentUser, { photoURL })
            await update(ref(database, `users/${currentUser.uid}`), { photoURL })

            setToast({ message: 'Profile photo updated!', type: 'success' })
        } catch (error) {
            console.error(error)
            setToast({ message: 'Failed to upload photo.', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        { icon: BellIcon, label: 'Notifications', type: 'toggle', value: true },
        { icon: LanguageIcon, label: 'Language', sub: 'English', action: () => { } },
        { icon: QuestionMarkCircleIcon, label: 'Help & Support', action: () => { } },
        { icon: ArrowRightOnRectangleIcon, label: 'Logout', color: 'text-red-600', action: logout }
    ]

    return (
        <div className="min-h-full bg-slate-50 font-sans p-6 pb-24">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Identity Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200">
                        {userProfile?.photoURL || currentUser?.photoURL ? (
                            <img src={userProfile?.photoURL || currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                                {userProfile?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    {/* Upload Button Overlay */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full shadow-lg transform transition-transform active:scale-95"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CameraIcon className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                    />
                </div>

                <h1 className="text-xl font-bold text-slate-900 mt-4">{userProfile?.name || 'Employee'}</h1>
                <p className="text-sm text-slate-500">{userProfile?.role || 'Staff Member'}</p>
                <div className="mt-2 inline-flex px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-slate-600">
                    ID: #{currentUser?.uid?.slice(0, 6).toUpperCase()}
                </div>
            </div>

            {/* Quick Stats */}
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-6 mb-3 px-1">This Month</h3>
            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Present" value={stats.present} type="present" />
                <StatCard label="Late" value={stats.late} type="late" />
                <StatCard label="Absent" value={stats.absent} type="absent" />
            </div>

            {/* Settings Menu */}
            <div className="bg-white rounded-lg border border-slate-200 mt-6 divide-y divide-slate-50 shadow-sm">
                {menuItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${item.color || 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${item.color || 'text-slate-700'}`}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.sub && <span className="text-sm text-slate-400">{item.sub}</span>}
                            {item.type === 'toggle' ? (
                                <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            ) : (
                                <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <p className="text-center text-xs text-slate-300 mt-8">ATLAS v1.0.0 (Enterprise)</p>
        </div>
    )
}
