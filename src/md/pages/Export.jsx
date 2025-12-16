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
            let filename = `atlas_attendance_${month}`

            // Fetch attendance for all users for selected month
            const promises = Object.keys(users).map(async uid => {
                // Skip admins/MD from attendance report if needed, or keep them. 
                // Usually admins don't mark attendance.
                if (users[uid].role === 'admin' || users[uid].role === 'md') return []

                const snap = await get(ref(database, `users/${uid}/attendance`))
                const att = snap.val() || {}
                // Filter for month
                const records = Object.values(att).filter(r => r.date && r.date.startsWith(month))

                // If no records, maybe return empty list? 
                // Or maybe we want a row per day? For now, just rows for existing records.
                return records.map(r => ({
                    Employee: users[uid].name,
                    Date: r.date,
                    Status: r.status,
                    Location: r.location,
                    CheckInTime: r.timestamp ? format(new Date(r.timestamp), 'h:mm a') : '-',
                    Site: r.siteName || '-'
                }))
            })

            const results = await Promise.all(promises)
            data = results.flat().sort((a, b) => a.Date.localeCompare(b.Date))

            if (data.length === 0) {
                setStatus({ type: 'error', message: 'No attendance records found for this month.' })
                setIsGenerating(false)
                return
            }

            // 2. Generate File
            const worksheet = XLSX.utils.json_to_sheet(data)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")

            if (fileFormat === 'csv') {
                XLSX.writeFile(workbook, `${filename}.csv`)
            } else {
                XLSX.writeFile(workbook, `${filename}.xlsx`)
            }

            setStatus({ type: 'success', message: 'Attendance report generated successfully.' })

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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Export Attendance</h1>
                <p className="text-slate-500 dark:text-slate-400">Download monthly attendance reports for all employees.</p>
            </div>

            <Card className="p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                <form onSubmit={handleExport} className="space-y-8">

                    {/* Report Type Visual (Static) */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Monthly Attendance Report</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Aggregated attendance data for all staff</div>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Select Month</label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full text-lg p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>

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
