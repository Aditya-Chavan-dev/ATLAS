import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import { clsx } from 'clsx'

// Remove the old CSS import since we are full Tailwind/Framer now
// import './MDLayout.css' 

function MDLayout() {
    const { userRole } = useAuth()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // Responsive Handler
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) setIsSidebarOpen(false)
            else setIsSidebarOpen(true)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    // Layout Classes
    const mainContentClass = clsx(
        "min-h-screen bg-bg-ground transition-all duration-300 ease-in-out pt-20", // pt-20 for fixed Navbar
        // Desktop margin adjustments based on sidebar state
        !isMobile && (isSidebarOpen ? "ml-[280px]" : "ml-[88px]")
    )

    return (
        <div className="min-h-screen bg-bg-ground flex">

            {/* New Sidebar Component */}
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isMobile={isMobile}
            />

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Navbar - Pass props to control sidebar */}
                <div className={clsx(
                    "fixed top-0 right-0 z-30 transition-all duration-300",
                    !isMobile && (isSidebarOpen ? "left-[280px]" : "left-[88px]"),
                    isMobile && "left-0"
                )}>
                    <Navbar toggleSidebar={toggleSidebar} isMobile={isMobile} />
                </div>

                {/* Content Area */}
                <main className={mainContentClass}>
                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    )
}

export default MDLayout

