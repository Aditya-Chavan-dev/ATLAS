import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { generateAttendanceReport } from '../../utils/excelExport'
import './Export.css'

function MDExport() {
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState([])
    const [attendanceData, setAttendanceData] = useState([])
    const [exportRange, setExportRange] = useState('1m') // 1m, 3m, 6m, 1y

    useEffect(() => {
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const records = Object.values(data)
                setAttendanceData(records)

                const empMap = new Map()
                records.forEach(r => {
                    if (!empMap.has(r.employeeEmail)) {
                        empMap.set(r.employeeEmail, {
                            email: r.employeeEmail,
                            name: r.employeeName
                        })
                    }
                })
                setEmployees(Array.from(empMap.values()))
            }
        })
        return () => unsubscribe()
    }, [])

    const handleExport = async () => {
        setLoading(true)
        try {
            const endDate = new Date()
            const startDate = new Date()

            switch (exportRange) {
                case '1m':
                    startDate.setMonth(endDate.getMonth() - 1)
                    break
                case '3m':
                    startDate.setMonth(endDate.getMonth() - 3)
                    break
                case '6m':
                    startDate.setMonth(endDate.getMonth() - 6)
                    break
                case '1y':
                    startDate.setFullYear(endDate.getFullYear() - 1)
                    break
                default:
                    startDate.setMonth(endDate.getMonth() - 1)
            }

            await generateAttendanceReport(startDate, endDate, employees, attendanceData)
        } catch (error) {
            console.error("Export failed:", error)
            alert("Export failed. See console for details.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="page-header">
                    <h1>Export Attendance</h1>
                    <p>Generate attendance reports in Excel format.</p>
                </header>

                <div className="export-card">
                    <div className="form-group">
                        <label>Select Duration</label>
                        <div className="range-selector">
                            <button
                                className={`range-btn ${exportRange === '1m' ? 'active' : ''}`}
                                onClick={() => setExportRange('1m')}
                            >
                                1 Month
                            </button>
                            <button
                                className={`range-btn ${exportRange === '3m' ? 'active' : ''}`}
                                onClick={() => setExportRange('3m')}
                            >
                                3 Months
                            </button>
                            <button
                                className={`range-btn ${exportRange === '6m' ? 'active' : ''}`}
                                onClick={() => setExportRange('6m')}
                            >
                                6 Months
                            </button>
                            <button
                                className={`range-btn ${exportRange === '1y' ? 'active' : ''}`}
                                onClick={() => setExportRange('1y')}
                            >
                                1 Year
                            </button>
                        </div>
                    </div>

                    <div className="export-info">
                        <p><strong>Employees found:</strong> {employees.length}</p>
                        <p><strong>Total records:</strong> {attendanceData.length}</p>
                    </div>

                    <button
                        className="export-btn"
                        onClick={handleExport}
                        disabled={loading || employees.length === 0}
                    >
                        {loading ? 'Generating...' : 'Download Excel Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MDExport
