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
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const records = Object.values(data)

                // Aggregate Employee Data
                const empMap = new Map()
                records.forEach(r => {
                    if (!empMap.has(r.employeeEmail)) {
                        empMap.set(r.employeeEmail, {
                            email: r.employeeEmail,
                            name: r.employeeName,
                            present: 0,
                            absent: 0, // Placeholder logic
                            lastSeen: r.date
                        })
                    }

                    const emp = empMap.get(r.employeeEmail)
                    if (r.status === 'approved') emp.present += 1
                    if (new Date(r.date) > new Date(emp.lastSeen)) emp.lastSeen = r.date
                })
                setEmployees(Array.from(empMap.values()))
            }
            setLoading(false)
        })
        return () => unsubscribe()
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
                                onClick={() => navigate(`/md/profiles/${encodeURIComponent(emp.email)}`)}
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
