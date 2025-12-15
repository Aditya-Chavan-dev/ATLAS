import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import './Export.css'
function MDExport() {
    const { currentUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState([])

    // Form State
    const [reportType, setReportType] = useState('master') // 'master' or 'single'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [selectedEmpId, setSelectedEmpId] = useState('')

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    useEffect(() => {
        const usersRef = ref(database, 'users')

        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val() || {}
            const empList = Object.entries(data)
                .map(([uid, user]) => ({ uid, ...user }))
                .filter(u => u.role !== 'md' && u.role !== 'admin')
            setEmployees(empList)
            if (empList.length > 0 && !selectedEmpId) {
                setSelectedEmpId(empList[0].uid)
            }
        })

        return () => {
            unsubUsers()
        }
    }, [selectedEmpId])

    const handleExport = async () => {
        setLoading(true)
        try {
            let url = ''

            if (reportType === 'master') {
                // Master Report - Monthly only (as per user requirement)
                const [year, month] = selectedMonth.split('-')
                url = `${API_URL}/api/export-attendance-report?month=${month}&year=${year}`

                // Trigger download
                const link = document.createElement('a')
                link.href = url
                link.download = `Attendance_${month}_${year}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                // Single Employee Report - Not implemented yet, can use client-side for now
                alert('Single employee report coming soon. Please use Master Report for now.')
            }
        } catch (error) {
            console.error("Export failed:", error)
            alert("Export failed. Please check console.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="md-page-container">
            <header className="page-header">
                <div>
                    <h1>Export Data</h1>
                    <p>Download attendance reports in Excel format</p>
                </div>
            </header>

            <div className="export-container">
                {/* 1. Report Type Selection */}
                <div className="radio-group">
                    <div
                        className={`radio-card ${reportType === 'master' ? 'active' : ''}`}
                        onClick={() => setReportType('master')}
                    >
                        <div className="radio-icon">📊</div>
                        <div className="radio-label">Master Report</div>
                        <div className="radio-sub">Combined attendance for all employees</div>
                    </div>

                    <div
                        className={`radio-card ${reportType === 'single' ? 'active' : ''}`}
                        onClick={() => setReportType('single')}
                    >
                        <div className="radio-icon">👤</div>
                        <div className="radio-label">Single Employee</div>
                        <div className="radio-sub">Detailed report for one employee</div>
                    </div>
                </div>

                {/* 2. Parameters Section */}
                <div className="export-section">
                    <div className="section-title">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Report Settings
                    </div>

                    {/* Month Picker - Only for Master Report */}
                    {reportType === 'master' && (
                        <div className="control-group">
                            <label className="control-label">Select Month</label>
                            <input
                                type="month"
                                className="date-input"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                    )}

                    {currentUser && currentUser.email === 'santy9shinde@gmail.com' ? (
                        <button
                            className="download-btn"
                            onClick={handleExport}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download Excel
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="restricted-access-msg text-amber-600 bg-amber-50 p-3 rounded-lg text-sm font-medium border border-amber-100 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Access Restricted: Only authorized administrators can download this report.
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`notification-result ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MDExport
