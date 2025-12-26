// AuthContext - Updated 2025-12-13
// Database structure changed from /users to /employees
// Employee data now includes: employeeId, dateOfBirth
// Attendance nested under /employees/{uid}/attendance/{date}

import { createContext, useContext, useState, useEffect, useRef } from 'react'

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth'
import {
    ref,
    get,
    set,
    child,
    query,
    orderByChild,
    equalTo,
    remove,
    onValue,
    off
} from 'firebase/database'
import { auth, database } from '../firebase/config'
import { isMD } from '../md/config/mdAllowList'
import { isHR } from '../config/hrAllowList'
import { ROLES, isOwner } from '../config/roleConfig'


// Create Auth Context
const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const listenerRefs = useRef({
        profile: null,
        email: null
    })

    const stopRealtimeListeners = () => {
        Object.values(listenerRefs.current).forEach((cleanup) => cleanup?.())
        listenerRefs.current = { profile: null, email: null }
    }

    const startRealtimeListeners = (user) => {
        stopRealtimeListeners()
        if (!user?.uid) return

        const normalizedEmail = user.email?.toLowerCase()
        // Target: /employees/{uid}/profile
        const userRef = ref(database, `employees/${user.uid}/profile`)

        const handleProfileSnapshot = (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val()
                setUserRole(data.role)
                setUserProfile(data)
            } else {
                setUserRole(null)
                setUserProfile(null)
            }
        }

        onValue(userRef, handleProfileSnapshot, (error) => {
            console.error('❌ Realtime profile listener error:', error)
        })

        listenerRefs.current.profile = () => off(userRef, 'value', handleProfileSnapshot)

        if (!normalizedEmail) return

        const employeesRef = ref(database, 'employees')
        const emailQuery = query(employeesRef, orderByChild('email'), equalTo(normalizedEmail))

        const handleEmailSnapshot = async (snapshot) => {
            if (!snapshot.exists()) return

            const data = snapshot.val()
            const entries = Object.entries(data)
            const hasRealUid = entries.some(([key]) => key === user.uid)

            if (!hasRealUid && entries.length > 0) {
                const [oldUid, profileData] = entries[0]
                try {
                    const updatedProfile = {
                        ...profileData,
                        uid: user.uid,
                        email: normalizedEmail,
                        photoURL: user.photoURL || profileData.photoURL || '',
                        role: profileData.role || ROLES.EMPLOYEE
                    }
                    await set(ref(database, `employees/${user.uid}/profile`), updatedProfile)
                    // If migration happened, we might want to clean up the flat keys if any, but let's stick to setting profile
                    // await remove(ref(database, `employees/${oldUid}`)) // This removes the OLD placeholder. 
                    // But wait, the placeholder might have been 'flat'. 
                    // We should remove the old referencing node.
                    await remove(ref(database, `employees/${oldUid}`))
                    console.log('♻️ Auto-migrated placeholder record back to user UID:', normalizedEmail)
                } catch (error) {
                    console.error('❌ Error migrating placeholder record:', error)
                }
            }
        }

        onValue(emailQuery, handleEmailSnapshot, (error) => {
            console.error('❌ Realtime email listener error:', error)
        })

        listenerRefs.current.email = () => off(emailQuery, 'value', handleEmailSnapshot)
    }

    useEffect(() => {
        return () => {
            stopRealtimeListeners()
        }
    }, [])

    // Listen for auth state changes
    useEffect(() => {
        console.log('🔐 Setting up Firebase auth listener...')

        // Default persistence is LOCAL (persists even after browser close)
        // We ensure it here explicitly if needed, but Firebase default is usually local.
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                console.log('✅ Auth persistence set to LOCAL (persists indefinitely)')
            })
            .catch((error) => {
                console.error('❌ Error setting auth persistence:', error)
            })

        try {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                console.log('🔄 Auth state changed:', user ? user.email : 'No user')

                stopRealtimeListeners()

                if (user) {
                    // ⚡ OPTIMIZATION: Optimistic Role Assignment
                    // Set role IMMEDIATELY based on allowlist to unblock UI
                    let optimisticRole = null
                    if (isOwner(user.email)) optimisticRole = ROLES.OWNER
                    else if (isMD(user.email)) optimisticRole = ROLES.MD
                    else if (isHR(user.email)) optimisticRole = ROLES.HR

                    if (optimisticRole) {
                        console.log('⚡ Optimistic Role Set:', optimisticRole)
                        setUserRole(optimisticRole)
                        // Don't wait for DB to load UI, but still fetch profile to populate userProfile state
                    }

                    try {
                        // Single centralized DB fetch
                        const dbRef = ref(database)
                        const userSnapshot = await get(child(dbRef, `employees/${user.uid}/profile`))

                        let profileData = null
                        if (userSnapshot.exists()) {
                            profileData = userSnapshot.val()
                        }

                        // Determine final authority role
                        // If allowlist says MD/HR/OWNER, that overrides DB.
                        // If allowlist is specific, ensure DB reflects it.

                        if (optimisticRole) {
                            // We are special role. Ensure DB matches.
                            const needsUpdate = !profileData || profileData.role !== optimisticRole

                            if (needsUpdate) {
                                console.log('🔄 Syncing DB role to match Allowlist:', optimisticRole)
                                profileData = {
                                    uid: user.uid,
                                    email: user.email,
                                    name: user.displayName || (profileData?.name || optimisticRole),
                                    photoURL: user.photoURL || (profileData?.photoURL || ''),
                                    role: optimisticRole,
                                    phone: profileData?.phone || ''
                                }
                                await set(ref(database, `employees/${user.uid}/profile`), profileData)
                            }
                            // Finalize state
                            setUserProfile(profileData)
                            startRealtimeListeners(user)

                        } else {
                            // Normal Employee Case
                            if (profileData) {
                                setUserRole(profileData.role)
                                setUserProfile(profileData)
                                startRealtimeListeners(user)
                            } else {
                                // Waiting Room / New User
                                console.log('⏳ User waiting for approval/role assignment:', user.email)
                                setUserRole(null)
                                setUserProfile(null)
                                startRealtimeListeners(user)
                            }
                        }
                    } catch (dbError) {
                        console.error('❌ Error fetching user profile:', dbError)
                        // Even if DB fails, if we had optimistic role, keep it
                        if (!optimisticRole) setUserRole(null)
                    }
                } else {
                    setUserRole(null)
                    setUserProfile(null)
                }

                setCurrentUser(user)
                setLoading(false)
            })

            return unsubscribe
        } catch (authError) {
            console.error('❌ Error setting up auth listener:', authError)
        }
    }, [])

    // Google Sign In
    const loginWithGoogle = async () => {
        try {
            // ✅ CRITICAL: Force LOCAL persistence before sign-in flow starts
            // This ensures the session token is stored permanently across refreshes
            await setPersistence(auth, browserLocalPersistence);

            const provider = new GoogleAuthProvider()
            // Force account selection on every login
            provider.setCustomParameters({
                prompt: 'select_account'
            })

            const result = await signInWithPopup(auth, provider)
            const user = result.user
            // Logic is handled by onAuthStateChanged listener which triggers immediately after sign-in
            // We just return user here to satisfy promise
            return { user }
        } catch (error) {
            console.error('❌ Login error:', error)
            throw error
        }
    }

    // Logout
    const logout = async () => {
        try {
            await signOut(auth)
            // State updates handled by onAuthStateChanged
        } catch (error) {
            console.error('❌ Logout error:', error)
            throw error
        }
    }

    const value = {
        currentUser,
        userRole,
        userProfile,
        loading,
        loginWithGoogle,
        logout
    }



    // Add loading timeout to prevent infinite loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ Auth loading timeout - forcing completion')
                setLoading(false)
            }
        }, 5000) // 5 second timeout

        return () => clearTimeout(timeout)
    }, [loading])

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-slate-50">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-500 text-sm font-medium">Loading...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    )
}

export default AuthContext
