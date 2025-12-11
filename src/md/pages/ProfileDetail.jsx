import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ref, onValue, push } from 'firebase/database'
import { database } from '../../firebase/config'
import * as ExcelUtils from '../../utils/excelExport' // Use new excel utility
import './ProfileDetail.css'

function MDProfileDetail() {
    const { id } = useParams() // id is uid
    const navigate = useNavigate()
    const [employee, setEmployee] = useState(null)
    const [history, setHistory] = useState([])
    const [remarks, setRemarks] = useState([])
    const [newRemark, setNewRemark] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

    const getFormatSuffix = (d) => {
        if (d > 3 && d < 21) return 'th'
        switch (d % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    const formatDatePretty = (dateStr) => {
        const date = new Date(dateStr)
        const dayNum = date.getDate()
        const monthStr = date.toLocaleString('default', { month: 'short' })
        const yearStr = date.getFullYear()
        return `${dayNum}${getFormatSuffix(dayNum)} ${monthStr} ${yearStr}`
    }

    useEffect(() => {
        // Fetch User Profile
        const userRef = ref(database, `users/${id}`)
        const unsubscribeUser = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setEmployee(snapshot.val())
            } else {
                setEmployee(null)
            }
        })

        // Fetch Attendance
        const attendanceRef = ref(database, 'attendance')
        const unsubscribeAtt = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const allRecords = Object.values(data)
                // Filter by UID
                const empRecords = allRecords.filter(r => r.employeeId === id)
                setHistory(empRecords.sort((a, b) => new Date(b.date) - new Date(a.date)))
            }
            setLoading(false)
        })

        // Fetch Remarks
        const remarksRef = ref(database, `employees/${id}/remarks`)
        const unsubRemarks = onValue(remarksRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const remarksList = Object.values(data).sort((a, b) => b.timestamp - a.timestamp)
                setRemarks(remarksList)
            } else {
                setRemarks([])
            }
        })

        return () => {
            unsubscribeUser()
            unsubscribeAtt()
            unsubRemarks()
        }
    }, [id])

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return
        try {
            const remarksRef = ref(database, `employees/${id}/remarks`)
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
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0)

        await ExcelUtils.generateSingleEmployeeReport(startDate, endDate, employee, history)
    }

    if (loading) return <div className="loading-state">Loading profile...</div>
    if (!employee) return <div className="error-state">Employee not found</div>

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="detail-header">
                    <button className="back-btn" onClick={() => navigate('/md/profiles')}>
                        <span style={{ fontSize: '20px' }}>←</span> Back
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
                            <h3>Statistics (Total)</h3>
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
                            <div className="add-remark">
                                <textarea
                                    placeholder="Add a private note..."
                                    value={newRemark}
                                    onChange={(e) => setNewRemark(e.target.value)}
                                />
                                <button onClick={handleAddRemark}>Add Note</button>
                            </div>
                            <div className="remarks-list">
                                {remarks.length === 0 && <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', margin: '10px 0' }}>No remarks yet.</p>}
                                {remarks.map((r, i) => (
                                    <div key={i} className="remark-item">
                                        <p>{r.text}</p>
                                        <small>{formatDatePretty(new Date(r.timestamp))}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History Grid */}
                    <div className="profile-main">
                        <div className="history-section">
                            <h3>Attendance History</h3>
                            <div className="history-list-view">
                                {history.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No attendance records found.</p>}
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
                                                {formatDatePretty(record.date)}
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
