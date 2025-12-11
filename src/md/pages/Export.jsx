import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import './Export.css'

function MDExport() {
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState([])

    // Form State
    const [reportType, setReportType] = useState('master') // 'master' or 'single'
    const [duration, setDuration] = useState('month') // 'month' or 'year'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
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

                    {/* Employee Selector (Conditional) */}
                    {reportType === 'single' && (
                        <div className="control-group fade-in">
                            <label className="control-label">Select Employee</label>
                            <select
                                className="custom-select"
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                            >
                                <option value="" disabled>Select an employee</option>
                                {employees.map(emp => (
                                    <option key={emp.uid} value={emp.uid}>
                                        {emp.name || emp.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        className="download-btn"
                        onClick={handleExport}
                        disabled={loading || (reportType === 'single' && !selectedEmpId)}
                    >
                        {loading ? (
                            <span>Generating Report...</span>
                        ) : (
                            <>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download Excel Sheet</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MDExport
