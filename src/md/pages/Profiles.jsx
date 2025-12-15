import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import ProfileList from '../components/ProfileList'
import ProfileDetail from '../components/ProfileDetail'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
// import './Profiles.css' // Removed old CSS

function MDProfiles() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    useEffect(() => {
        // We only need the list of users here for the sidebar
        // Detail component fetches its own detailed data
        const usersRef = ref(database, 'users')
        const attendanceRef = ref(database, 'attendance') // Optimization: We assume we need some stats for the list card, so we fetch att here too.

        const fetchData = () => {
            onValue(usersRef, (userSnap) => {
                const usersData = userSnap.val() || {}
                const userList = Object.entries(usersData)
                    .map(([uid, user]) => ({ uid, ...user, present: 0, lastSeen: null }))
                    .filter(u => u.role !== 'md' && u.role !== 'admin')

                onValue(attendanceRef, (attSnap) => {
                    const attData = attSnap.val() || {}
                    const attRecords = Object.values(attData)

                    userList.forEach(u => {
                        const userAtt = attRecords.filter(r => r.employeeId === u.uid)
                        u.present = userAtt.filter(r => r.status === 'approved').length
                        if (userAtt.length > 0) {
                            const dates = userAtt.map(r => r.date).sort()
                            u.lastSeen = dates[dates.length - 1]
                        }
                    })

                    setEmployees(userList)
                    setLoading(false)
                }, { onlyOnce: true })
            })
        }

        fetchData()
    }, [])

    return (
        <div className="h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
            {/* LEFT PANE: LIST */}
            <div className={clsx(
                "flex-shrink-0 transition-all duration-300 h-full",
                // Mobile Logic: If selected, hide list (width 0 or hidden), else full width
                // Desktop Logic: Fixed width 380px or 35%
                selectedId ? "hidden md:block w-full md:w-[380px] lg:w-[420px]" : "w-full md:w-[380px] lg:w-[420px]"
            )}>
                <ProfileList
                    employees={employees}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            </div>

            {/* RIGHT PANE: DETAIL */}
            <div className={clsx(
                "flex-1 h-full bg-slate-50 transition-all duration-300",
                // Mobile Logic: If selected, show full width. If not, hidden.
                // Desktop Logic: Always visible (or placeholder)
                selectedId ? "block w-full" : "hidden md:block"
            )}>
                <AnimatePresence mode="wait">
                    {selectedId ? (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full"
                        >
                            <ProfileDetail
                                employeeId={selectedId}
                                onClose={() => setSelectedId(null)}
                            />
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-fade-in">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600">Select an employee</h3>
                            <p>Choose a team member from the list to view their attendance, history, and remarks.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default MDProfiles
