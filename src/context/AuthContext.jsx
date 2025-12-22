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
                    try {
                        const dbRef = ref(database)
                        const userSnapshot = await get(child(dbRef, `employees/${user.uid}/profile`))

                        if (userSnapshot.exists()) {
                            let profileData = userSnapshot.val()

                            // Check if user is in MD allowlist - override database role if needed
                            if (isMD(user.email)) {
                                if (profileData.role !== ROLES.MD) {
                                    console.log('🔄 Auth listener: Updating role to MD for', user.email)
                                    profileData.role = ROLES.MD
                                    profileData.role = ROLES.MD
                                    // Update in database
                                    await set(ref(database, `employees/${user.uid}/profile`), {
                                        ...profileData,
                                        role: ROLES.MD
                                    })
                                }
                            }

                            setUserRole(profileData.role)
                            setUserProfile(profileData)
                            startRealtimeListeners(user)
                        } else {
                            console.warn('⚠️ User profile not found in database.')
                            // If MD user has no profile, create one
                            if (isMD(user.email)) {
                                const mdProfile = {
                                    uid: user.uid,
                                    email: user.email,
                                    name: user.displayName || 'MD',
                                    photoURL: user.photoURL || '',
                                    role: ROLES.MD,
                                    phone: ''
                                }
                                await set(ref(database, `employees/${user.uid}/profile`), mdProfile)
                                setUserRole(ROLES.MD)
                                setUserProfile(mdProfile)
                                startRealtimeListeners(user)
                                console.log('✅ Created MD profile in auth listener')
                            }
                        }
                    } catch (dbError) {
                        console.error('❌ Error fetching user profile:', dbError)
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
            const provider = new GoogleAuthProvider()
            // Force account selection on every login
            provider.setCustomParameters({
                prompt: 'select_account'
            })

            const result = await signInWithPopup(auth, provider)
            const user = result.user
            const email = user.email

            let role = null
            let profileData = null

            // 0. Check OWNER first - has access to metrics dashboard
            if (isOwner(email)) {
                role = ROLES.OWNER
                console.log('👤 Owner user logged in:', email)

                // Create/update owner profile
                const dbRef = ref(database)
                let userSnapshot = await get(child(dbRef, `employees/${user.uid}/profile`))

                if (userSnapshot.exists()) {
                    profileData = userSnapshot.val()
                    profileData.role = ROLES.OWNER
                } else {
                    profileData = {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || 'Owner',
                        photoURL: user.photoURL || '',
                        role: ROLES.OWNER,
                        phone: ''
                    }
                }
                await set(ref(database, `employees/${user.uid}/profile`), profileData)
            }
            // 1. Check MD allowlist next - this takes PRIORITY over employee
            else if (isMD(email)) {
                role = ROLES.MD
                console.log('👑 MD user logged in:', email)

                // Check if MD has a profile in database
                const dbRef = ref(database)
                let userSnapshot = await get(child(dbRef, `employees/${user.uid}/profile`))

                if (userSnapshot.exists()) {
                    profileData = userSnapshot.val()
                    // Override role to MD even if database says employee
                    if (profileData.role !== ROLES.MD) {
                        console.log('🔄 Updating database role from', profileData.role, 'to MD')
                        profileData.role = ROLES.MD
                        // Update in database
                        await set(ref(database, `employees/${user.uid}/profile`), {
                            ...profileData,
                            role: ROLES.MD
                        })
                    }
                } else {
                    // Create MD profile if doesn't exist
                    profileData = {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || 'MD',
                        photoURL: user.photoURL || '',
                        role: ROLES.MD,
                        phone: ''
                    }
                    await set(ref(database, `employees/${user.uid}/profile`), profileData)
                    console.log('✅ Created MD profile in database')
                }
            } else {
                // 2. Check Firebase DB for employee
                const dbRef = ref(database)
                let userSnapshot = await get(child(dbRef, `employees/${user.uid}/profile`))

                if (userSnapshot.exists()) {
                    // Existing employee with correct UID
                    profileData = userSnapshot.val()
                    role = profileData.role
                    console.log('✅ Existing employee logged in:', email)
                } else {
                    // 3. Fallback: Check if added by MD (lookup by email)
                    // This handles the first login where the user has a placeholder UID
                    console.log('🔍 Checking for pre-added employee record by email...')
                    const employeesRef = ref(database, 'employees')
                    const emailQuery = query(employeesRef, orderByChild('email'), equalTo(email))
                    const emailSnapshot = await get(emailQuery)

                    if (emailSnapshot.exists()) {
                        // Found the pre-added record!
                        const data = emailSnapshot.val()
                        const oldUid = Object.keys(data)[0] // Get the placeholder UID (e.g. emp_123)
                        profileData = data[oldUid]

                        console.log('♻️ Found pre-added record. Migrating to real UID...', oldUid)

                        // Update profile with real UID and photo
                        const updatedProfile = {
                            ...profileData,
                            uid: user.uid,
                            photoURL: user.photoURL || '',
                            email: user.email // Ensure email matches exactly
                        }

                        // Save to new location (real UID)
                        await set(ref(database, `employees/${user.uid}/profile`), updatedProfile)

                        // Delete old placeholder record
                        await remove(ref(database, `employees/${oldUid}`))

                        role = updatedProfile.role
                        profileData = updatedProfile
                        console.log('✅ Migration complete. Logged in as:', role)
                    } else {
                        // Not in allowlist and not in DB - unauthorized
                        console.log('❌ Unauthorized user:', email)
                        await signOut(auth)
                        throw new Error('You are not authorized to access this system. Please contact your administrator.')
                    }
                }
            }


            // Update local state
            setCurrentUser(user)
            setUserRole(role)
            setUserProfile(profileData)

            return { user, role }
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
