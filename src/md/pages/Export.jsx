import React, { useState } from 'react'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import {
    Download, Calendar as CalendarIcon,
    FileSpreadsheet, AlertCircle, CheckCircle2,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
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
            const [year, monthNum] = month.split('-')

            // Fetch employees from Firebase
            const usersRef = ref(database, 'employees')
            const snapshot = await get(usersRef)

            if (!snapshot.exists()) {
                throw new Error('No employee data found')
            }

            const employeesData = snapshot.val()

            // Process employees with same logic as backend
            const employees = Object.entries(employeesData)
                .map(([uid, data]) => {
                    const profile = data.profile || data
                    return {
                        uid,
                        name: profile.name,
                        email: profile.email,
                        role: profile.role,
                        status: profile.status,
                        attendance: data.attendance || {}
                    }
                })
                .filter(emp => {
                    const isActive = !emp.status || emp.status === 'active'
                    const isNotOwner = emp.role !== 'owner'
                    return isActive && isNotOwner && emp.name && emp.email
                })
                .sort((a, b) => {
                    const emailA = (a.email || '').toLowerCase()
                    const emailB = (b.email || '').toLowerCase()
                    const nameA = (a.name || a.email || '').toUpperCase()
                    const nameB = (b.name || b.email || '').toUpperCase()

                    const isRvsA = nameA.includes('RVS')
                    const isRvsB = nameB.includes('RVS')
                    if (isRvsA && !isRvsB) return -1
                    if (!isRvsA && isRvsB) return 1
                    if (isRvsA && isRvsB) return 0

                    const isSantyA = emailA === 'santy9shinde@gmail.com'
                    const isSantyB = emailB === 'santy9shinde@gmail.com'

                    const isRealMDA = a.role === 'md' && !isSantyA && !isRvsA
                    const isRealMDB = b.role === 'md' && !isSantyB && !isRvsB
                    if (isRealMDA && !isRealMDB) return -1
                    if (!isRealMDA && isRealMDB) return 1
                    if (isRealMDA && isRealMDB) return 0

                    if (isSantyA && !isSantyB) return -1
                    if (!isSantyA && isSantyB) return 1
                    if (isSantyA && isSantyB) return 0

                    return nameA.localeCompare(nameB)
                })

            // Fetch leaves
            const leavesSnapshot = await get(ref(database, 'leaves'))
            const leavesData = leavesSnapshot.val() || {}
            const allLeaves = []
            Object.values(leavesData).forEach(userLeaves => {
                Object.values(userLeaves).forEach(leave => allLeaves.push(leave))
            })

            // Generate Excel with calendar matrix format
            const ExcelJS = (await import('exceljs')).default
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Attendance')

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const monthName = monthNames[parseInt(monthNum) - 1]
            const yearNum = parseInt(year)

            // Generate dates
            const daysInMonth = new Date(yearNum, parseInt(monthNum), 0).getDate()
            const dates = []
            for (let day = 1; day <= daysInMonth; day++) {
                dates.push(new Date(yearNum, parseInt(monthNum) - 1, day))
            }

            // Row 1: Autoteknik
            worksheet.mergeCells(1, 1, 1, employees.length + 1)
            const titleCell = worksheet.getCell(1, 1)
            titleCell.value = 'Autoteknik'
            titleCell.font = { size: 16, bold: true }
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

            // Row 2: Attendance Month Year
            worksheet.mergeCells(2, 1, 2, employees.length + 1)
            const subtitleCell = worksheet.getCell(2, 1)
            subtitleCell.value = `Attendance ${monthName} ${yearNum}`
            subtitleCell.font = { size: 14, bold: true }
            subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }

            // Row 3: Headers (GREEN)
            const headerRow = worksheet.getRow(3)
            headerRow.getCell(1).value = 'DATE'
            headerRow.getCell(1).font = { bold: true }
            headerRow.getCell(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF92D050' }
            }

            employees.forEach((emp, index) => {
                const cell = headerRow.getCell(index + 2)
                cell.value = (emp.name || emp.email).toUpperCase()
                cell.font = { bold: true }
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF92D050' }
                }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
            })

            // Data rows
            dates.forEach((date, dateIndex) => {
                const row = worksheet.getRow(dateIndex + 4)
                const dateStr = date.toISOString().split('T')[0]
                const dayOfWeek = date.getDay()
                const isSunday = dayOfWeek === 0

                // Date column
                const dateCell = row.getCell(1)
                dateCell.value = `${date.getDate()}-${monthName}-${yearNum.toString().slice(-2)}`
                dateCell.font = { bold: true, size: 11 }
                dateCell.alignment = { horizontal: 'center', vertical: 'middle' }

                if (isSunday) {
                    dateCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF00' }
                    }
                }

                employees.forEach((emp, empIndex) => {
                    const cell = row.getCell(empIndex + 2)
                    const empName = (emp.name || '').toUpperCase()
                    const isRVS = empName.includes('RVS')

                    cell.font = { bold: true, size: 10 }
                    cell.alignment = { horizontal: 'center', vertical: 'middle' }

                    // RVS auto-marking
                    if (isRVS) {
                        if (isSunday) {
                            cell.value = 'H'
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFFF00' }
                            }
                        } else {
                            cell.value = 'OFFICE'
                        }
                        return
                    }

                    // Check for leave
                    const leave = allLeaves.find(l => {
                        if (l.employeeEmail !== emp.email || l.status !== 'approved') return false
                        const leaveStart = new Date(l.from)
                        const leaveEnd = new Date(l.to)
                        leaveStart.setHours(0, 0, 0, 0)
                        leaveEnd.setHours(0, 0, 0, 0)
                        const checkDate = new Date(date)
                        checkDate.setHours(0, 0, 0, 0)
                        return checkDate >= leaveStart && checkDate <= leaveEnd
                    })

                    if (isSunday) {
                        cell.value = 'H'
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' }
                        }
                    } else if (leave) {
                        cell.value = 'L'
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF90EE90' }
                        }
                    } else {
                        const attendanceRecord = emp.attendance?.[dateStr]
                        if (attendanceRecord && attendanceRecord.status === 'Present') {
                            if (attendanceRecord.locationType === 'Office') {
                                cell.value = 'OFFICE'
                            } else if (attendanceRecord.locationType === 'Site') {
                                cell.value = attendanceRecord.siteName ? attendanceRecord.siteName.toUpperCase() : 'SITE'
                            }
                        } else {
                            cell.value = ''
                        }
                    }
                })
            })

            // Set column widths
            worksheet.getColumn(1).width = 15
            employees.forEach((emp, index) => {
                const empName = (emp.name || emp.email).toUpperCase()
                const columnWidth = Math.max(12, Math.min(25, empName.length + 2))
                worksheet.getColumn(index + 2).width = columnWidth
            })

            // Add borders
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber >= 3) {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FF000000' } },
                            left: { style: 'thin', color: { argb: 'FF000000' } },
                            bottom: { style: 'thin', color: { argb: 'FF000000' } },
                            right: { style: 'thin', color: { argb: 'FF000000' } }
                        }
                    })
                }
            })

            // Set row heights
            worksheet.getRow(1).height = 25
            worksheet.getRow(2).height = 20
            worksheet.getRow(3).height = 20

            // Download
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Attendance_${monthName}_${yearNum}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setStatus({ type: 'success', message: 'Calendar matrix report downloaded successfully!' })

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
                            Report Format
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Calendar Matrix Layout
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Green Headers
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Yellow Sundays
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                OFFICE / Site Codes
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
