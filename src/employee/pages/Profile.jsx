// Profile Page - Clean Settings-Style UI
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import {
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    EnvelopeIcon,
    PencilSquareIcon,
    PhoneIcon,
    IdentificationIcon,
    SunIcon,
    MoonIcon,
    BellIcon,
    ShieldCheckIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import { ref, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { unsubscribeTokenFromBroadcast } from '../../services/fcm'

export default function EmployeeProfile() {
    const { currentUser, userProfile, logout, loading: authLoading } = useAuth()
    const { isDarkMode, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', phone: '' })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!isEditing) {
            setEditForm({
                name: userProfile?.name || currentUser?.displayName || '',
                phone: userProfile?.phone || ''
            })
        }
    }, [userProfile, currentUser, isEditing])

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div
                    className="animate-spin rounded-full h-8 w-8 border-2"
                    style={{ borderColor: 'var(--emp-accent)', borderTopColor: 'transparent' }}
                />
                <p className="text-sm mt-3" style={{ color: 'var(--emp-text-muted)' }}>
                    Loading profile...
                </p>
            </div>
        )
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p style={{ color: 'var(--emp-text-muted)' }}>Please log in to view profile</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 rounded-lg"
                    style={{ background: 'var(--emp-accent)', color: '#fff' }}
                >
                    Go to Login
                </button>
            </div>
        )
    }

    const handleLogout = async () => {
        try {
            if (userProfile?.fcmToken) {
                await unsubscribeTokenFromBroadcast(userProfile.fcmToken)
            }
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Failed to log out', error)
        }
    }

    const handleSaveProfile = async () => {
        if (!editForm.name.trim() || !currentUser) return
        setIsSaving(true)
        try {
            const userRef = ref(database, `employees/${currentUser.uid}`)
            await update(userRef, {
                name: editForm.name,
                phone: editForm.phone
            })
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const displayName = userProfile?.name || currentUser?.displayName || 'Employee'
    const displayEmail = currentUser?.email || 'No email'
    const displayPhone = userProfile?.phone || 'Not set'
    const displayId = userProfile?.employeeId || 'N/A'
    const avatarLetter = displayName.charAt(0).toUpperCase()

    return (
        <div className="space-y-6 emp-fade-in pb-6">
            {/* Profile Header */}
            <div className="emp-card text-center py-6">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                    {currentUser?.photoURL ? (
                        <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover"
                            style={{ border: '3px solid var(--emp-accent)' }}
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                            style={{
                                background: 'var(--emp-button-gradient)',
                                color: '#ffffff',
                                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            {avatarLetter}
                        </div>
                    )}
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(true)
                                setEditForm({
                                    name: displayName,
                                    phone: userProfile?.phone || ''
                                })
                            }}
                            className="absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg"
                            style={{ background: 'var(--emp-accent)', color: '#ffffff' }}
                        >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Name & Edit Form */}
                {isEditing ? (
                    <div className="space-y-3 max-w-xs mx-auto">
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="emp-input text-center"
                            placeholder="Enter Name"
                            autoFocus
                        />
                        <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="emp-input text-center"
                            placeholder="Enter Phone Number"
                        />
                        <div className="flex justify-center gap-2 pt-1">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                                style={{ background: 'var(--emp-success)', color: '#ffffff' }}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--emp-bg-secondary)', color: 'var(--emp-text-secondary)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--emp-text-primary)' }}>{displayName}</h2>
                        <p className="text-sm" style={{ color: 'var(--emp-text-muted)' }}>Software Engineer</p>
                    </>
                )}
            </div>

            {/* Account Section */}
            <div>
                <p className="emp-section-title">Account</p>
                <div className="emp-card p-0 overflow-hidden">
                    {/* Email */}
                    <div className="emp-settings-item">
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{ background: 'var(--emp-accent-glow)', color: 'var(--emp-accent)' }}>
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Email</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>{displayEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="emp-settings-item">
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--emp-success)' }}>
                                <PhoneIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Phone</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>{displayPhone}</p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--emp-text-muted)' }} />
                    </div>

                    {/* Employee ID */}
                    <div className="emp-settings-item">
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--emp-warning)' }}>
                                <IdentificationIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Employee ID</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>{displayId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div>
                <p className="emp-section-title">Preferences</p>
                <div className="emp-card p-0 overflow-hidden">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="emp-settings-item w-full"
                    >
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{
                                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: isDarkMode ? 'var(--emp-accent)' : 'var(--emp-warning)'
                            }}>
                                {isDarkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Dark Mode</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>
                                    {isDarkMode ? 'On' : 'Off'}
                                </p>
                            </div>
                        </div>
                        <div className={`emp-toggle ${isDarkMode ? 'active' : ''}`}></div>
                    </button>

                    {/* Notifications */}
                    <div className="emp-settings-item">
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                                <BellIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Receive Notifications</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Attendance reminders</p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--emp-text-muted)' }} />
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div>
                <p className="emp-section-title">Security</p>
                <div className="emp-card p-0 overflow-hidden">
                    {/* Change Password */}
                    <div className="emp-settings-item">
                        <div className="flex items-center gap-3">
                            <div className="emp-settings-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--emp-accent)' }}>
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--emp-text-primary)' }}>Change Password</p>
                                <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Update your password</p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--emp-text-muted)' }} />
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--emp-danger)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Sign Out
            </button>

            {/* Version */}
            <p className="text-center text-xs pt-2" style={{ color: 'var(--emp-text-muted)' }}>
                ATLAS v2.5.0
            </p>
        </div>
    )
}
