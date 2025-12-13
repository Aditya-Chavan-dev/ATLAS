import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { UserCircleIcon, ArrowRightOnRectangleIcon, PhoneIcon, EnvelopeIcon, BriefcaseIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ref, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { unsubscribeTokenFromBroadcast } from '../../services/fcm'

export default function EmployeeProfile() {
    const { currentUser, userProfile, logout } = useAuth()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        phone: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    // Sync form with profile when loaded
    useEffect(() => {
        if (userProfile && !isEditing) {
            setEditForm({
                name: userProfile.name || currentUser?.displayName || '',
                phone: userProfile.phone || ''
            })
        }
    }, [userProfile, currentUser, isEditing])

    // Show loading while userProfile loads
    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 text-sm">Loading profile...</p>
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
            // Update in Firebase Realtime Database
            const userRef = ref(database, `users/${currentUser.uid}`)
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

    return (
        <div className="space-y-6 animate-fade-in max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10" />

                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-indigo-600 mb-4 ring-4 ring-white shadow-xl relative z-10 mt-4">
                    <UserCircleIcon className="w-20 h-20" />
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(true)
                                // create a local copy to edit so we don't rely on the effect immediately
                                setEditForm({
                                    name: userProfile?.name || currentUser?.displayName || '',
                                    phone: userProfile?.phone || ''
                                })
                            }}
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                            title="Edit Profile"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="w-full space-y-3 z-10 relative">
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full text-center font-bold text-lg text-slate-800 border-b border-indigo-200 focus:border-indigo-500 focus:outline-none pb-1 bg-transparent"
                            placeholder="Enter Name"
                            autoFocus
                        />
                        <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full text-center text-sm text-slate-600 border-b border-indigo-200 focus:border-indigo-500 focus:outline-none pb-1 bg-transparent"
                            placeholder="Enter Phone Number"
                        />
                        <div className="flex justify-center gap-2 pt-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-1 bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 mb-2">
                        <h3 className="text-2xl font-bold text-slate-800">
                            {userProfile?.name || currentUser?.displayName || 'Employee Name'}
                        </h3>
                        <p className="text-slate-500 font-medium">
                            {userProfile?.phone || 'No phone number added'}
                        </p>
                    </div>
                )}
            </div>

            {/* Details List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <EnvelopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Email</p>
                        <p className="text-sm font-semibold text-slate-700">{currentUser?.email}</p>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full bg-white border-2 border-red-100 hover:bg-red-50 text-red-600 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Log Out
            </button>

            <div className="text-center pb-4">
                <p className="text-xs text-slate-400 font-medium">App Version 2.2.0 (Production)</p>
            </div>
        </div>
    )
}
