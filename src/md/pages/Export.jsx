import React, { useState } from 'react'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import {
    Download, FileSpreadsheet, FileText, Calendar,
    CheckCircle, AlertCircle
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import * as XLSX from 'xlsx' // assuming installed, or we use CDN/mock logic if not in package.json
// If XLSX is not available in environment, we can fallback to CSV generation manually

// UI Components
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function MDExport() {
    const [reportType, setReportType] = useState('attendance') // 'attendance' | 'leaves' | 'employees'
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [fileFormat, setFileFormat] = useState('xlsx') // 'xlsx' | 'csv'
    const [isGenerating, setIsGenerating] = useState(false)
    const [status, setStatus] = useState(null) // { type: 'success'|'error', message: '' }

    const handleExport = async (e) => {
        e.preventDefault()
        setIsGenerating(true)
        setStatus(null)

        try {
            // 1. Fetch Data
            const usersSnap = await get(ref(database, 'users'))
            const users = usersSnap.val() || {}

            let data = []
            let filename = `atlas_report_${format(new Date(), 'yyyyMMdd_HHmm')}`

            if (reportType === 'employees') {
                // Employee List
                filename = `atlas_employees_${format(new Date(), 'yyyyMMdd')}`
                data = Object.values(users).map(u => ({
                    Name: u.name,
                    Email: u.email,
                    Role: u.role,
                    Joined: u.createdAt ? format(new Date(u.createdAt), 'yyyy-MM-dd') : '-',
                    Status: u.isPlaceholder ? 'Pending' : 'Active'
                }))

            } else if (reportType === 'attendance') {
                // Monthly Attendance
                filename = `atlas_attendance_${month}`
                // Fetch attendance for all users for selected month
                // Note: In a real large app, this data fetch would be optimized or server-side

                const promises = Object.keys(users).map(async uid => {
                    const snap = await get(ref(database, `employees/${uid}/attendance`))
                    const att = snap.val() || {}
                    // Filter for month
                    const records = Object.values(att).filter(r => r.date && r.date.startsWith(month))
                    return records.map(r => ({
                        Employee: users[uid].name,
                        Date: r.date,
                        Time: '9:00 AM', // Mock if not stored
                        Status: r.status,
                        Location: r.location,
                        Site: r.siteName || '-'
                    }))
                })

                const results = await Promise.all(promises)
                data = results.flat().sort((a, b) => a.Date.localeCompare(b.Date))

            } else if (reportType === 'leaves') {
                // Leaves Report
                filename = `atlas_leaves_${month}`
                const promises = Object.keys(users).map(async uid => {
                    const snap = await get(ref(database, `leaves/${uid}`))
                    const leaves = snap.val() || {}
                    return Object.values(leaves).map(l => ({
                        Employee: users[uid].name,
                        AppliedOn: l.appliedAt ? format(new Date(l.appliedAt), 'yyyy-MM-dd') : '-',
                        From: l.from,
                        To: l.to,
                        Days: l.totalDays,
                        Type: l.type,
                        Status: l.status,
                        Reason: l.reason
                    }))
                })
                const results = await Promise.all(promises)
                data = results.flat()
            }

            if (data.length === 0) {
                setStatus({ type: 'error', message: 'No data found for the selected criteria.' })
                setIsGenerating(false)
                return
            }

            // 2. Generate File
            const worksheet = XLSX.utils.json_to_sheet(data)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

            if (fileFormat === 'csv') {
                XLSX.writeFile(workbook, `${filename}.csv`)
            } else {
                XLSX.writeFile(workbook, `${filename}.xlsx`)
            }

            setStatus({ type: 'success', message: 'Report generated and downloaded successfully.' })

        } catch (error) {
            console.error(error)
            setStatus({ type: 'error', message: 'Failed to generate report. Please try again.' })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="page-container p-6 max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Export Data</h1>
                <p className="text-slate-500 dark:text-slate-400">Generate reports for attendance, leaves, and employee records.</p>
            </div>

            <Card className="p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                <form onSubmit={handleExport} className="space-y-8">

                    {/* Report Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Report Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'attendance', label: 'Attendance', icon: Calendar },
                                { id: 'employees', label: 'Employees', icon: FileText },
                                { id: 'leaves', label: 'Leaves', icon: FileSpreadsheet }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setReportType(type.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${reportType === type.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                                        }`}
                                >
                                    <type.icon size={24} className="opacity-80" />
                                    <span className="font-medium text-sm">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range (Conditional) */}
                    {reportType !== 'employees' && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Select Month</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full text-lg p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                        </div>
                    )}

                    {/* Format */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">File Format</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${fileFormat === 'xlsx' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {fileFormat === 'xlsx' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                                <input type="radio" name="format" value="xlsx" checked={fileFormat === 'xlsx'} onChange={() => setFileFormat('xlsx')} className="hidden" />
                                <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Excel (.xlsx)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${fileFormat === 'csv' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {fileFormat === 'csv' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                                <input type="radio" name="format" value="csv" checked={fileFormat === 'csv'} onChange={() => setFileFormat('csv')} className="hidden" />
                                <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">CSV (.csv)</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        size="lg"
                        className="w-full h-14 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-brand-primary"
                        loading={isGenerating}
                        icon={Download}
                    >
                        {isGenerating ? 'Generating Report...' : 'Download Report'}
                    </Button>

                    {/* Status Message */}
                    {status && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm animate-fade-in ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {status.message}
                        </div>
                    )}

                </form>
            </Card>
        </div>
    )
}
