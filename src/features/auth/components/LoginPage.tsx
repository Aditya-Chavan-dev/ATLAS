import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function LoginPage() {
    const { user, loading, error, signIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#e8eef5] to-[#d1dce8] p-4 md:p-6 relative overflow-hidden font-sans">

            {/* Background Decor (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"></div>

            {/* Header / Logo */}
            <header className="relative z-10 text-center mb-8 md:mb-10 w-full max-w-lg animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-900 to-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-900/20 mb-5 md:mb-6 transform hover:scale-105 hover:rotate-3 transition-all duration-500 cursor-default ring-4 ring-white/50">
                    <span className="text-4xl md:text-5xl font-extrabold text-white font-sans drop-shadow-md">A</span>
                </div>
                <h1 className="sr-only">ATLAS Login</h1>
                <p className="text-slate-600 font-semibold text-sm md:text-base lg:text-lg max-w-xs md:max-w-none mx-auto leading-relaxed tracking-wide uppercase">
                    Attendance Tracking & Logging<br className="hidden md:block" /> Automation System
                </p>
            </header>

            {/* Login Card */}
            <section className="relative z-10 w-full max-w-[340px] md:max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 p-8 md:p-12 transition-all duration-500 hover:shadow-[0_40px_70px_-12px_rgba(30,58,138,0.2)] animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                    <p className="text-slate-500 text-sm md:text-base">Sign in to access your workspace</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50/80 border border-red-100/50 text-red-600 text-sm font-medium rounded-xl text-center animate-pulse flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={signIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl hover:bg-slate-50 hover:border-blue-400 hover:ring-4 hover:ring-blue-50 transition-all duration-300 group transform active:scale-[0.98] shadow-sm hover:shadow-md"
                    aria-label="Sign in with Google"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-slate-500 font-medium">Connecting...</span>
                        </div>
                    ) : (
                        <>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt=""
                                className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                            />
                            <span className="text-slate-700 font-bold text-base md:text-lg tracking-tight group-hover:text-slate-900">Sign in with Google</span>
                        </>
                    )}
                </button>
            </section>

            {/* Footer */}
            <footer className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <p className="text-xs md:text-sm text-slate-500/80 font-medium">
                    Protected System • <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">IT Support</a>
                </p>
            </footer>
        </main>
    );
}
