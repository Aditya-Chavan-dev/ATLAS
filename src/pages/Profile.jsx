import { useState, useEffect } from 'react'
import { ref, update } from 'firebase/database'
import { database } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

function Profile() {
    const { currentUser, userProfile } = useAuth()
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (userProfile?.phone) {
            setPhone(userProfile.phone)
        }
    }, [userProfile])

    const handleUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        // Validate phone number
        const phoneDigits = phone.replace(/\D/g, '') // Remove non-digits
        if (phoneDigits.length !== 10) {
            setMessage('❌ Phone number must be exactly 10 digits')
            setLoading(false)
            return
        }

        try {
            const userRef = ref(database, `users/${currentUser.uid}`)
            await update(userRef, {
                phone: phoneDigits // Save clean 10-digit number
            })
            setMessage('✅ Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            setMessage('❌ Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!userProfile) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-text-secondary text-lg">
                Loading profile...
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-bg-card backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-card text-center sticky top-24">
                        <div className="flex flex-col items-center">
                            {currentUser.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-accent-color/30 shadow-lg mb-4"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-glass-border shadow-lg mb-4">
                                    {userProfile.name?.charAt(0) || userProfile.email?.charAt(0)}
                                </div>
                            )}
                            <h1 className="text-2xl font-bold text-text-primary mb-2">{userProfile.name}</h1>
                            <span className="inline-block bg-bg-secondary text-text-secondary px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border border-glass-border uppercase">
                                {userProfile.role}
                            </span>
                        </div>

                        <div className="mt-8 pt-8 border-t border-glass-border w-full">
                            <div className="flex flex-col gap-4 text-left">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                                        Email Address
                                    </label>
                                    <p className="text-text-primary font-medium truncate" title={userProfile.email}>
                                        {userProfile.email}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                                        Member Since
                                    </label>
                                    <p className="text-text-primary font-medium">
                                        {new Date(userProfile.joinDate).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-bg-card backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-card">
                        <h2 className="text-xl font-bold text-text-primary mb-6 pb-4 border-b border-glass-border">
                            Edit Profile Details
                        </h2>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter 10-digit phone number"
                                    className="w-full px-4 py-3 bg-input-bg border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-color focus:ring-2 focus:ring-accent-glow transition-all duration-200"
                                />
                                <p className="mt-2 text-xs text-text-secondary">
                                    Used for important notifications and account recovery.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3.5 px-6 rounded-xl text-white font-semibold text-sm tracking-wide shadow-lg transition-all duration-200 ${loading
                                            ? 'bg-gray-500 cursor-not-allowed opacity-70'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:translate-y-[-2px] hover:shadow-blue-500/25'
                                        }`}
                                >
                                    {loading ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div className={`mt-6 p-4 rounded-xl text-center font-medium border ${message.includes('✅')
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
