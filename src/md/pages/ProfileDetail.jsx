import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ref, onValue, push } from 'firebase/database'
import { database } from '../../firebase/config'
import { generateAttendanceReport } from '../../utils/excelExport'
import './ProfileDetail.css'

function MDProfileDetail() {
    const { id } = useParams() // id is email
    const navigate = useNavigate()
    const [employee, setEmployee] = useState(null)
    const [history, setHistory] = useState([])
    const [remarks, setRemarks] = useState([])
    const [newRemark, setNewRemark] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

    const decodedEmail = decodeURIComponent(id)

    useEffect(() => {
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const allRecords = Object.values(data)
                const empRecords = allRecords.filter(r => r.employeeEmail === decodedEmail)

                setHistory(empRecords.sort((a, b) => b.timestamp - a.timestamp))

                if (empRecords.length > 0) {
                    setEmployee({
                        name: empRecords[0].employeeName,
                        email: decodedEmail
                    })
                }
            }
            setLoading(false)
        })

        // Fetch Remarks (Mocking separate node for now or could be real)
        const remarksRef = ref(database, `employees/${decodedEmail.replace('.', '_')}/remarks`)
        const unsubRemarks = onValue(remarksRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                setRemarks(Object.values(data))
            }
        })

        return () => {
            unsubscribe()
            unsubRemarks()
        }
    }, [decodedEmail])

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return
        try {
            const remarksRef = ref(database, `employees/${decodedEmail.replace('.', '_')}/remarks`)
            await push(remarksRef, {
                text: newRemark,
                timestamp: Date.now(),
                author: 'MD'
            })
            setNewRemark('')
        } catch (error) {
            console.error("Error adding remark:", error)
        }
    }

    const handleExport = async () => {
        if (!employee) return
        const [year, month] = selectedMonth.split('-')
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        await generateAttendanceReport(monthDate, [employee], history)
    }

    if (loading) return <div className="loading-state">Loading profile...</div>
    if (!employee) return <div className="error-state">Employee not found</div>

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="detail-header">
                    <button className="back-btn" onClick={() => navigate('/md/profiles')}>
                        ← Back
                    </button>
                    <div className="header-main">
                        <div className="header-user">
                            <div className="user-avatar-lg">
                                {(employee.name || employee.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1>{employee.name || 'Unknown'}</h1>
                                <p>{employee.email}</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-selector"
                            />
                            <button className="export-btn-sm" onClick={handleExport}>
                                Export Report
                            </button>
                        </div>
                    </div>
                </header>

                <div className="profile-content-grid">
                    {/* Left Column: Stats & Remarks */}
                    <div className="profile-sidebar">
                        <div className="info-card">
                            <h3>Statistics</h3>
                            <div className="stat-row">
                                <span>Present Days</span>
                                <strong>{history.filter(r => r.status === 'approved').length}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Site Visits</span>
                                <strong>{history.filter(r => r.location === 'site').length}</strong>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>MD Remarks</h3>
                            <div className="remarks-list">
                                {remarks.map((r, i) => (
                                    <div key={i} className="remark-item">
                                        <p>{r.text}</p>
                                        <small>{new Date(r.timestamp).toLocaleDateString()}</small>
                                    </div>
                                ))}
                            </div>
                            <div className="add-remark">
                                <textarea
                                    placeholder="Add a private note..."
                                    value={newRemark}
                                    onChange={(e) => setNewRemark(e.target.value)}
                                />
                                <button onClick={handleAddRemark}>Add Note</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History Grid */}
                    <div className="profile-main">
                        <div className="history-section">
                            <h3>Attendance History</h3>
                            <div className="history-list-view">
                                {history.map(record => (
                                    <div key={record.id} className="history-item">
                                        <div className="history-date">
                                            <span className="day">{new Date(record.date).getDate()}</span>
                                            <span className="month">{new Date(record.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div className="history-details">
                                            <div className="h-status">
                                                <span className={`status-tag ${record.status}`}>
                                                    {record.status}
                                                </span>
                                                <span className="location-tag">
                                                    {record.location === 'office' ? '🏢 Office' : '🏗️ Site'}
                                                </span>
                                            </div>
                                            <div className="h-time">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MDProfileDetail
