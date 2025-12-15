import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ref, onValue, push } from 'firebase/database'
import { database } from '../../firebase/config'
import * as ExcelUtils from '../../utils/excelExport'
import { Calendar, MapPin, FileText, Download, Send, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { clsx } from 'clsx'

export default function ProfileDetail({ employeeId, onClose }) {
    const [employee, setEmployee] = useState(null)
    const [history, setHistory] = useState([])
    const [remarks, setRemarks] = useState([])
    const [newRemark, setNewRemark] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [activeTab, setActiveTab] = useState('overview') // overview, history, remarks

    useEffect(() => {
        if (!employeeId) return

        setLoading(true)

        const userRef = ref(database, `users/${employeeId}`)
        const remarksRef = ref(database, `employees/${employeeId}/remarks`)
        const attendanceRef = ref(database, 'attendance') // This is heavy, optimization would be to index by user

        // Parallel Fetching
        const unsubUser = onValue(userRef, snap => setEmployee(snap.val()))

        const unsubRemarks = onValue(remarksRef, snap => {
            const data = snap.val() || {}
            setRemarks(Object.values(data).sort((a, b) => b.timestamp - a.timestamp))
        })

        const unsubAtt = onValue(attendanceRef, snap => {
            const data = snap.val() || {}
            // Client side filter (Not ideal for production with millions, but fine for thousands)
            const recs = Object.values(data)
                .filter(r => r.employeeId === employeeId)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
            setHistory(recs)
            setLoading(false)
        })

        return () => {
            unsubUser()
            unsubRemarks()
            unsubAtt()
        }
    }, [employeeId])

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return
        const remarksRef = ref(database, `employees/${employeeId}/remarks`)
        await push(remarksRef, {
            text: newRemark,
            timestamp: Date.now(),
            author: 'MD'
        })
        setNewRemark('')
    }

    const handleExport = async () => {
        if (!employee) return
        const [year, month] = selectedMonth.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0)
        await ExcelUtils.generateSingleEmployeeReport(startDate, endDate, employee, history)
    }

    if (!employeeId) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 text-slate-400">
                <p>Select an employee to view details</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        )
    }

    if (!employee) return <div className="p-10 text-center">Employee not found</div>

    return (
        <div className="h-full flex flex-col bg-bg-ground overflow-hidden">
            {/* Header (Cover & Info) */}
            <div className="relative bg-white shadow-sm z-10">
                {/* Mobile Close Button (Only visible on mobile) */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 left-4 z-20 p-2 bg-black/20 text-white rounded-full backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                {/* Cover Gradient */}
                <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>

                <div className="px-8 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden">
                                {(employee.name || 'U').charAt(0)}
                            </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <Button size="sm" variant="secondary" onClick={handleExport} icon={Download}>
                                Report
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                        <p className="text-slate-500">{employee.email} • {employee.phone || 'No Phone'}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-6 border-b border-slate-200">
                        {['overview', 'history', 'remarks'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "pb-3 text-sm font-medium transition-colors relative",
                                    activeTab === tab ? "text-brand-primary" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <AnimatePresence mode="wait">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Present (Total)</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {history.filter(r => r.status === 'approved').length}
                                        </p>
                                    </div>
                                </Card>
                                <Card className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Site Visits</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {history.filter(r => r.location === 'site').length}
                                        </p>
                                    </div>
                                </Card>
                            </div>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Latest Activity</h3>
                                {history.length > 0 ? (
                                    <div className="space-y-4">
                                        {history.slice(0, 3).map(rec => (
                                            <div key={rec.id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "w-2 h-2 rounded-full",
                                                        rec.status === 'approved' ? "bg-emerald-500" : "bg-amber-500"
                                                    )} />
                                                    <div>
                                                        <p className="font-medium text-slate-900">{rec.location === 'site' ? 'Site Visit' : 'Office'}</p>
                                                        <p className="text-xs text-slate-500">{new Date(rec.date).toDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={rec.status === 'approved' ? 'success' : 'warning'}>
                                                    {rec.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm">No activity recorded.</p>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Card className="overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-700">Attendance Log</h3>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1"
                                    />
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {history.map(rec => (
                                        <div key={rec.id} className="p-4 border-b border-slate-50 hover:bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center w-12 text-slate-500">
                                                    <div className="text-xl font-bold text-slate-800">{new Date(rec.date).getDate()}</div>
                                                    <div className="text-xs uppercase">{new Date(rec.date).toLocaleString('default', { month: 'short' })}</div>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{rec.siteName || (rec.location === 'site' ? 'Site' : 'Office')}</p>
                                                    <p className="text-xs text-slate-500">Checked in at {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <Badge variant={rec.status === 'approved' ? 'success' : 'warning'}>
                                                {rec.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <div className="p-8 text-center text-slate-400">No records found for this period.</div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* REMARKS TAB */}
                    {activeTab === 'remarks' && (
                        <motion.div
                            key="remarks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <Card className="p-4">
                                <div className="flex gap-2">
                                    <textarea
                                        placeholder="Add a private note regarding this employee..."
                                        value={newRemark}
                                        onChange={(e) => setNewRemark(e.target.value)}
                                        className="flex-1 min-h-[80px] p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                                    />
                                    <Button onClick={handleAddRemark} variant="primary" disabled={!newRemark.trim()} className="self-end" icon={Send} />
                                </div>
                            </Card>

                            <div className="space-y-3">
                                {remarks.map((r, i) => (
                                    <motion.div key={i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <p className="text-slate-800">{r.text}</p>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{new Date(r.timestamp).toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
