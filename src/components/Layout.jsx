import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import './Layout.css'

const Layout = ({ children }) => {
    const location = useLocation()
    const isLoginPage = location.pathname === '/'

    return (
        <div className="app-layout">
            <div className="app-background">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {!isLoginPage && <Navbar />}

            <main className="app-content">
                {children}
            </main>
        </div>
    )
}

export default Layout
