import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import MDNavbar from '../md/components/MDNavbar'
import MDBottomNav from '../md/components/MDBottomNav'
import { clsx } from 'clsx'

export default function MDLayout() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
            {/* Top Navbar */}
            <MDNavbar isMobile={isMobile} toggleSidebar={() => { }} />

            {/* Main Content */}
            <main className={clsx(
                "w-full max-w-7xl mx-auto p-4 md:p-6 pb-24", // pb-24 for bottom nav clearance
            )}>
                <Outlet />
            </main>

            {/* Bottom Navigation (Always Visible) */}
            <MDBottomNav />
        </div>
    )
}




