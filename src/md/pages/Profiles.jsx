import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useNavigate } from 'react-router-dom'
import './Profiles.css'

function MDProfiles() {
    const navigate = useNavigate()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const usersRef = ref(database, 'users')
        const attendanceRef = ref(database, 'attendance')

        const fetchData = () => {
            // Fetch Users first
            onValue(usersRef, (userSnap) => {
                const usersData = userSnap.val() || {}
                const userList = Object.entries(usersData)
                    .map(([uid, user]) => {
                        // Filter out MD/Admin roles if needed, or keep all
                        return { uid, ...user, present: 0, absent: 0, lastSeen: 'Never' }
                    })
                    // Filter out MDs if you want only employees. The user requirement says "Employee Profiles".
                    // Usually we hide MDs.
                    .filter(u => u.role !== 'md' && u.role !== 'admin')

                // Fetch Attendance to aggregate stats
                onValue(attendanceRef, (attSnap) => {
                    const attData = attSnap.val() || {}
                    const attRecords = Object.values(attData)

                    // userList is the base.
                    const userMap = new Map()
                    userList.forEach(u => userMap.set(u.uid, u))

                    attRecords.forEach(r => {
                        const emp = userMap.get(r.employeeId)
                        if (emp) {
                            if (r.status === 'approved') emp.present += 1
                            if (!emp.lastSeen || emp.lastSeen === 'Never' || new Date(r.date) > new Date(emp.lastSeen)) {
                                emp.lastSeen = r.date
                            }
                        }
                    })

                    setEmployees(Array.from(userMap.values()))
                    setLoading(false)
                }, { onlyOnce: true }) // We can keep this realtime, but nested is bad.
                // Better approach: Separate listeners like MDApprovals.
                // But for now, let's just make it work. The user list changes rarely.
                // To be robust:
            })
        }

        // Better implementation with separate listeners to avoid nesting hell and memory leaks
        let rawUsers = {}
        let rawAttendance = {}

        const unsubUsers = onValue(usersRef, (snap) => {
            rawUsers = snap.val() || {}
            processData()
        })

        const unsubAtt = onValue(attendanceRef, (snap) => {
            rawAttendance = snap.val() || {}
            processData()
        })

        const processData = () => {
            // Avoid processing if users not loaded
            if (Object.keys(rawUsers).length === 0 && !loading) return

            const userList = Object.entries(rawUsers)
                .map(([uid, user]) => ({ uid, ...user, present: 0, lastSeen: 'Never' }))
                .filter(u => u.role !== 'md' && u.role !== 'admin')

            const attRecords = Object.values(rawAttendance)

            userList.forEach(u => {
                const userAtt = attRecords.filter(r => r.employeeId === u.uid)
                u.present = userAtt.filter(r => r.status === 'approved').length
                // Find latest date
                if (userAtt.length > 0) {
                    const dates = userAtt.map(r => r.date).sort()
                    u.lastSeen = dates[dates.length - 1]
                }
            })

            setEmployees(userList)
            setLoading(false)
        }

        return () => {
            unsubUsers()
            unsubAtt()
        }
    }, [])

    const filteredEmployees = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="page-header">
                    <div>
                        <h1>Employee Profiles</h1>
                        <p>View and manage employee records</p>
                    </div>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="loading-state">Loading profiles...</div>
                ) : (
                    <div className="profiles-grid">
                        {filteredEmployees.map(emp => (
                            <div
                                key={emp.email}
                                className="profile-card"
                                onClick={() => navigate(`/md/profiles/${emp.uid}`)}
                            >
                                <div className="profile-header">
                                    <div className="profile-avatar">
                                        {(emp.name || emp.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="profile-info">
                                        <h3>{emp.name || 'Unknown'}</h3>
                                        <p>{emp.email}</p>
                                    </div>
                                </div>
                                <div className="profile-stats">
                                    <div className="p-stat">
                                        <span className="label">Present</span>
                                        <span className="value success">{emp.present}</span>
                                    </div>
                                    <div className="p-stat">
                                        <span className="label">Last Seen</span>
                                        <span className="value">{emp.lastSeen}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MDProfiles
