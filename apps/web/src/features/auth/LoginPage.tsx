import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithGoogle } from './AuthUtils';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
    const { user, loading, error: contextError } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    // 🛡️ Guard: Authenticated users never see the login page
    useEffect(() => {
        if (!loading && user) {
            navigate(from, { replace: true });
        }
    }, [user, loading, navigate, from]);

    const handleLogin = async () => {
        // 🛡️ Double-Submission Guard
        if (isLoggingIn || loading) return;

        setIsLoggingIn(true);
        setLocalError(null);

        try {
            await loginWithGoogle();
            // Auth state update will trigger the useEffect redirect
        } catch (err: any) {
            setLocalError(err.message);
            setIsLoggingIn(false);
        }
    };

    const displayError = localError || contextError?.message;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-container p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ATLAS<span className="text-blue-500">v2.0</span></h1>
                    <p className="text-gray-500 text-sm">Zuckerberg Standard Identity Portal</p>
                </div>

                {displayError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
                        {displayError}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoggingIn || loading}
                    className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all
            ${isLoggingIn || loading
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-gray-100 active:scale-[0.98] shadow-lg shadow-white/5'
                        }`}
                >
                    {isLoggingIn ? (
                        <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.33l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                        </svg>
                    )}
                    <span>{isLoggingIn ? 'Verifying Account...' : 'Continue with Google'}</span>
                </button>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-gray-600 text-xs">
                        Restricted System. Absolute Isolation Protocol Active.
                    </p>
                </div>
            </div>
        </div>
    );
};
