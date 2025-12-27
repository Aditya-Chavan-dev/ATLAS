// AuthContext.jsx
// AUTHORITATIVE AUTHENTICATION SYSTEM
// Single Source of Truth: Firebase Realtime Database (/employees/{uid}/profile)
// 
// 1. No optimistic role assignment.
// 2. Strict status checks (ACTIVE only).
// 3. One-time Owner bootstrapping.
// 4. Global auth persistence.

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
    onValue,
    off
} from 'firebase/database'
import { auth, database } from '../firebase/config'
import { ROLES, isOwnerEmail } from '../config/roleConfig'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

    // Track listeners to clean up
    const profileListenerRef = useRef(null)

    const stopProfileListener = () => {
        if (profileListenerRef.current) {
            profileListenerRef.current()
            profileListenerRef.current = null
        }
    }

    // -----------------------------------------------------
    // CORE: Realtime Profile Sync & Role Enforcement
    // -----------------------------------------------------
    const setupProfileListener = (uid, email) => {
        stopProfileListener()
        const userRef = ref(database, `employees/${uid}/profile`)

        console.log('🔒 Establishing Authoritative Connection for', uid)

        const handleSnapshot = async (snapshot) => {
            if (snapshot.exists()) {
                const profile = snapshot.val()

                // 0. Owner Auto-Repair (Critical Recovery)
                if (isOwnerEmail(email)) {
                    if (profile.role !== ROLES.OWNER || profile.status !== 'ACTIVE') {
                        console.warn('👑 Detecting Owner Discrepancy. Auto-Repairing...')
                        try {
                            await set(userRef, {
                                ...profile,
                                role: ROLES.OWNER,
                                status: 'ACTIVE',
                                email: email.toLowerCase() // Ensure consistency
                            })
                            // We don't need to do anything else, the listener will fire again with the new data
                            return
                        } catch (err) {
                            console.error('❌ Owner Auto-Repair Failed:', err)
                        }
                    }
                }

                // 1. Status Check
                if (profile.status === 'REVOKED') {
                    console.warn(`⛔ Access REVOKED for ${email}`)
                    setAuthError('Your access has been revoked by the administrator.')
                    await logout()
                    return
                }

                if (profile.status === 'SUSPENDED') {
                    console.warn(`⛔ Access SUSPENDED for ${email}`)
                    setAuthError('Your account is currently suspended.')
                    setUserRole(null) // Lockout
                    setUserProfile(profile)
                    return
                }

                // 2. Role Resolution
                if (profile.role && profile.status === 'ACTIVE') {
                    console.log(`✅ Role Resolved: ${profile.role}`)
                    setUserRole(profile.role)
                    setUserProfile(profile)
                    setAuthError(null)
                } else {
                    // Pending Activation or Invalid State
                    console.warn(`⏳ User ${email} is awaiting activation or has invalid state.`)
                    setUserRole(null)
                    setUserProfile(profile)
                }

            } else {
                console.log('🆕 New User Detected - Attempting Bootstrap or Registration')
                // Profile doesn't exist. Check for Owner Bootstrap.
                if (isOwnerEmail(email)) {
                    console.log('👑 Bootstrapping OWNER Account...')
                    const ownerProfile = {
                        uid: uid,
                        email: email.toLowerCase(),
                        name: 'System Owner',
                        role: ROLES.OWNER,
                        status: 'ACTIVE',
                        createdAt: Date.now()
                    }
                    try {
                        await set(userRef, ownerProfile)
                        console.log('✅ Owner Bootstrapped. Refreshing...')
                        // Listener will catch the update automatically
                    } catch (err) {
                        console.error('❌ Bootstrap Failed:', err)
                        setAuthError('Critical: Failed to bootstrap owner account.')
                    }
                } else {
                    // Standard User Registration - Role/Status must be set by Admin
                    // We DO NOT create a profile here to avoid polluting DB with garbage.
                    // Or we can create a "pending" profile.
                    // Decision: Create 'UNREGISTERED' profile placeholder? 
                    // Better: Let UI handle "No Profile" as "Contact Admin".
                    setUserRole(null)
                    setUserProfile(null)
                    setAuthError(null)
                }
            }
        }

        onValue(userRef, handleSnapshot, (error) => {
            console.error('❌ Profile Sync Error:', error)
            setAuthError('Connection to authorization server failed.')
        })

        profileListenerRef.current = () => off(userRef, 'value', handleSnapshot)
    }

    // -----------------------------------------------------
    // Auth State Listener
    // -----------------------------------------------------
    useEffect(() => {
        // Enforce Persistence
        setPersistence(auth, browserLocalPersistence).catch(console.error)

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('🔑 Auth State: Authenticated', user.email)
                setCurrentUser(user)
                if (!user.isAnonymous) {
                    setupProfileListener(user.uid, user.email)
                } else {
                    // Anonymous User (Demo Mode) handled separately or ignored here
                    // DemoApp handles its own context usually, but if we share:
                    console.log('🎭 Anonymous User (Demo Mode)')
                    setUserRole('DEMO_USER') // Virtual role for context
                    setLoading(false)
                }
            } else {
                console.log('🔒 Auth State: Signed Out')
                setCurrentUser(null)
                setUserRole(null)
                setUserProfile(null)
                stopProfileListener()
            }
            setLoading(false)
        })

        return () => {
            unsubscribe()
            stopProfileListener()
        }
    }, [])

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider()
            provider.setCustomParameters({ prompt: 'select_account' })
            await signInWithPopup(auth, provider)
        } catch (error) {
            console.error('Login Failed', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            stopProfileListener()
            await signOut(auth)
            // State clears in onAuthStateChanged
        } catch (error) {
            console.error('Logout Failed', error)
        }
    }

    const value = {
        currentUser,
        userRole,
        userProfile,
        loading,
        authError,
        loginWithGoogle,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && (
                <div className="flex items-center justify-center min-h-screen bg-slate-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}
        </AuthContext.Provider>
    )
}

export default AuthContext
