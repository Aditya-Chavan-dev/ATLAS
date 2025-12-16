import React, { useState, useEffect } from 'react'
import { ref, onValue, push, set } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format, subMonths, isSameMonth, parseISO } from 'date-fns'
import {
    Calendar, CheckCircle, Clock, MapPin,
    FileText, Send, Download, Mail
} from 'lucide-react'
import clsx from 'clsx'

// UI Components
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function ProfileDetail({ employee }) {
    const { currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [attendanceData, setAttendanceData] = useState({})
    const [remarks, setRemarks] = useState([])
    const [newRemark, setNewRemark] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

    useEffect(() => {
        if (!employee?.uid) return
        setLoading(true)

        // 1. Fetch Attendance
        const attRef = ref(database, `employees/${employee.uid}/attendance`)
        const unsubAtt = onValue(attRef, (snap) => {
            setAttendanceData(snap.val() || {})
        })

        // 2. Fetch Remarks
        const remarksRef = ref(database, `employees/${employee.uid}/remarks`)
        const unsubRemarks = onValue(remarksRef, (snap) => {
            const data = snap.val()
            if (data) {
                setRemarks(Object.values(data).sort((a, b) => new Date(b.date) - new Date(a.date)))
            } else {
                setRemarks([])
            }
        })

        setLoading(false)

        return () => {
            unsubAtt()
            unsubRemarks()
        }
    }, [employee?.uid])

    const handleAddRemark = async (e) => {
        e.preventDefault()
        if (!newRemark.trim()) return

        const remarkRef = push(ref(database, `employees/${employee.uid}/remarks`))
        await set(remarkRef, {
            id: remarkRef.key,
            text: newRemark,
            author: currentUser.email || 'MD',
            date: new Date().toISOString()
        })
        setNewRemark('')
    }

    // --- Tab Content Renderers ---

    const renderOverview = () => {
        // Calculate basic stats for selected month
        const records = Object.values(attendanceData)
        const currentMonthRecords = records.filter(r => r.date && r.date.startsWith(selectedMonth))

        const presentCount = currentMonthRecords.filter(r => r.status === 'approved').length
        // Simple attendance %
        const attendanceRate = Math.round((presentCount / 22) * 100) // Assuming 22 working days

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
                        <div className="text-blue-600 dark:text-blue-400 mb-1"><CheckCircle size={20} /></div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{presentCount}</div>
                        <div className="text-xs text-slate-500 font-medium">Days Present</div>
                    </Card>
                    <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-emerald-600 dark:text-emerald-400 mb-1"><Clock size={20} /></div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</div>
                        <div className="text-xs text-slate-500 font-medium">Avg. Attendance</div>
                    </Card>
                    <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30">
                        <div className="text-amber-600 dark:text-amber-400 mb-1"><Calendar size={20} /></div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                        <div className="text-xs text-slate-500 font-medium">Leaves Taken</div>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                        {currentMonthRecords.slice(0, 5).reverse().map((rec, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                    <Clock size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        Marked Attendance
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {rec.date} • {rec.location || 'Office'}
                                    </div>
                                </div>
                                <Badge variant="success" className="text-[10px] uppercase">
                                    {rec.status}
                                </Badge>
                            </div>
                        ))}
                        {currentMonthRecords.length === 0 && (
                            <p className="text-slate-500 text-sm italic">No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const renderHistory = () => {
        const records = Object.entries(attendanceData)
            .filter(([date]) => date.startsWith(selectedMonth))
            .sort((a, b) => b[0].localeCompare(a[0])) // Descending date

        return (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Filter Month</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm w-full outline-none focus:border-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    {records.map(([date, data]) => (
                        <div key={date} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] uppercase font-bold">{format(parseISO(date), 'MMM')}</span>
                                    <span className="text-sm font-bold leading-none">{format(parseISO(date), 'dd')}</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        Checked In
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <MapPin size={10} /> {data.location === 'office' ? 'Office' : data.location}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant={data.status === 'approved' ? 'success' : 'warning'} className="mb-1">
                                    {data.status}
                                </Badge>
                                <div className="text-[10px] text-slate-400">9:00 AM</div>
                            </div>
                        </div>
                    ))}
                    {records.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            No records found for {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}.
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const renderRemarks = () => {
        return (
            <div className="space-y-6 animate-fade-in h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {remarks.map(remark => (
                        <div key={remark.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl relative">
                            <p className="text-sm text-slate-800 dark:text-slate-200 mb-2 whitespace-pre-wrap">{remark.text}</p>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{remark.author}</span>
                                <span>{format(parseISO(remark.date), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    ))}
                    {remarks.length === 0 && (
                        <div className="text-center py-10 text-slate-400 italic">
                            No remarks added yet.
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleAddRemark} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add a private note..."
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newRemark}
                            onChange={(e) => setNewRemark(e.target.value)}
                        />
                        <Button type="submit" size="sm" icon={Send} disabled={!newRemark.trim()}>
                            Add
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    if (!employee) return <div className="p-8 text-center text-slate-400">Select an employee to view details</div>

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-400 border-4 border-white dark:border-slate-900 shadow-sm">
                        {employee.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{employee.name}</h2>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <Mail size={14} /> {employee.email}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <Badge variant="default" className="text-[10px] uppercase tracking-wider">{employee.role}</Badge>
                            <Badge variant="success" className="text-[10px] uppercase tracking-wider">Active</Badge>
                        </div>
                    </div>
                </div>

                <Button variant="ghost" size="sm" icon={Download}>
                    Report
                </Button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-6">
                {['overview', 'history', 'remarks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "pb-3 pt-4 text-sm font-medium capitalize transition-colors relative",
                            activeTab === tab ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'remarks' && renderRemarks()}
            </div>
        </div>
    )
}
