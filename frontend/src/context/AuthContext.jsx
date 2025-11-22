import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Email/Password Login
    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Google Sign-In
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    // Phone Sign-In (returns confirmation result)
    const loginWithPhone = async (phoneNumber, recaptchaContainerId) => {
        const appVerifier = new RecaptchaVerifier(recaptchaContainerId, {
            size: 'invisible',
            callback: (response) => {
                // reCAPTCHA solved
            }
        }, auth);
        return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    // Logout
    const logout = async () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Assign role based on email
                let role = 'Employee'; // Default
                if (user.email === 'adityagchavan.skn.comp@gmail.com') {
                    role = 'MD';
                } else if (user.email === 'adityagchavan310@gmail.com') {
                    role = 'Employee';
                }

                // Add role to user object
                user.role = role;
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        loginWithGoogle,
        loginWithPhone,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
