import { Menu, Bell } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ toggleSidebar, isMobile }) {
    const { logout } = useAuth() // Or user profile if needed to show avatar
    const navigate = useNavigate()

    return (
        <header className={clsx(
            "h-20 px-6 flex items-center justify-between sticky top-0 z-20 transition-all duration-300",
            "bg-white/80 backdrop-blur-md border-b border-slate-200/50 supports-[backdrop-filter]:bg-white/60"
        )}>
            {/* Left: Hamburger (Mobile) or Welcome (Desktop) */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 focus:ring-2 focus:ring-brand-primary/20 transition-all active:scale-95"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:block">
                    {/* Breadcrumbs or Page Title could go here */}
                    <div className="text-sm text-slate-500">Welcome back,</div>
                    <div className="font-display font-semibold text-slate-800">Administrator</div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 relative transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="w-px h-8 bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px]">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <img
                                src="https://ui-avatars.com/api/?name=Admin+User&background=random"
                                alt="User"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
