import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export function LoginPage() {
    const { user, loading, error, signIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-subtle flex items-center justify-center border border-gray-100">
                        <ShieldCheck className="w-8 h-8 text-brand-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Welcome back to the <span className="font-semibold text-brand-600">ATLAS</span> workspace.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-subtle sm:rounded-xl sm:px-10 border border-gray-100">

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            <div className="text-sm text-red-700">
                                <span className="font-medium">Authentication Failed</span>
                                <p className="mt-1 text-red-600/90">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <button
                                onClick={signIn}
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <img className="h-5 w-5" src="https://www.google.com/favicon.ico" alt="Google" />
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500 text-xs uppercase tracking-wider">
                                    Trusted Envirnoment
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400">
                        &copy; 2026 ATLAS Systems. <br className="sm:hidden" />
                        <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a> &middot; <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
