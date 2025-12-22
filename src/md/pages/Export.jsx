import React, { useState } from 'react'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import {
    Download, Calendar as CalendarIcon,
    FileSpreadsheet, AlertCircle, CheckCircle2,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function MDExport() {
    // Default to current month
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: '' }

    const handleExport = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            // 1. Fetch Users (Source of Truth)
            const usersRef = ref(database, 'employees')
            const snapshot = await get(usersRef)

            if (!snapshot.exists()) {
                throw new Error('No user data found in system.')
            }

            const users = snapshot.val()
            let reportData = []
            const reportMonth = month // yyyy-MM

            // 2. Process Data
            Object.values(users).forEach(user => {
                // Filter: Real Employees Only (skip admins/md if desired, or keep for audit)
                // Let's exclude purely 'admin' roles who don't mark attendance usually
                if (user.role === 'admin') return

                // Check attendance
                if (user.attendance) {
                    const records = Object.values(user.attendance).filter(record =>
                        record.date && record.date.startsWith(reportMonth)
                    )

                    // Provide a row for every record found
                    records.forEach(record => {
                        reportData.push({
                            'Employee Name': user.name || 'Unknown',
                            'Email': user.email || '-',
                            'Date': record.date,
                            'Status': record.status,
                            'Location Type': record.locationType || '-',
                            'Site Name': record.siteName || (record.locationType === 'Office' ? 'Office' : '-'),
                            'Check-in Time': record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : '-',
                            'Approval Status': record.status === 'Present' ? 'Approved' : 'Pending/Rejected'
                        })
                    })
                }
            })

            // 3. Sort by Date then Name
            reportData.sort((a, b) => {
                const dateCompare = a['Date'].localeCompare(b['Date'])
                if (dateCompare !== 0) return dateCompare
                return a['Employee Name'].localeCompare(b['Employee Name'])
            })

            if (reportData.length === 0) {
                setStatus({ type: 'error', message: `No attendance records found for ${month}` })
                setLoading(false)
                return
            }

            // 4. Generate Excel
            const worksheet = XLSX.utils.json_to_sheet(reportData)

            // Auto-width for columns (simple heuristic)
            const colWidths = Object.keys(reportData[0]).map(key => ({
                wch: Math.max(key.length, 15)
            }))
            worksheet['!cols'] = colWidths

            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance")

            // 5. Download
            const fileName = `ATLAS_Attendance_${month}.xlsx`
            XLSX.writeFile(workbook, fileName)

            setStatus({ type: 'success', message: 'Report downloaded successfully!' })

        } catch (error) {
            console.error('Export failed:', error)
            setStatus({ type: 'error', message: error.message || 'Failed to generate report' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Attendance Reports
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                        Export detailed attendance logs for payroll and compliance.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Control Card */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                                Generate Report
                            </h2>
                        </div>

                        <div className="p-8 flex-1 flex flex-col gap-8">
                            {/* Month Selector */}
                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                                    Select Period
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CalendarIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium shadow-sm"
                                    />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Report includes all active employees, site visits, and approval statuses.
                                </p>
                            </div>

                            {/* Action Area */}
                            <div className="mt-auto pt-4">
                                <Button
                                    onClick={handleExport}
                                    disabled={loading}
                                    className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Generating Excel...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            Download Excel Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Info / Status Side Panel */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <AnimatePresence mode="wait">
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className={`p-6 border-l-4 shadow-sm ${status.type === 'success'
                                    ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                                    : 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {status.type === 'success' ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                                        )}
                                        <div>
                                            <h3 className={`font-bold ${status.type === 'success' ? 'text-emerald-900 dark:text-emerald-400' : 'text-red-900 dark:text-red-400'
                                                }`}>
                                                {status.type === 'success' ? 'Ready!' : 'Error'}
                                            </h3>
                                            <p className={`text-sm mt-1 ${status.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
                                                }`}>
                                                {status.message}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Stats or Tips */}
                    <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Report Columns
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Employee Details
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Exact Check-in Time
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                GPS Location / Site Name
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Approval Status
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
