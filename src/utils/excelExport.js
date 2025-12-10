import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export const generateAttendanceReport = async (startDate, endDate, employees, attendanceData) => {
    // startDate: Date object
    // endDate: Date object
    // employees: Array of employee objects { email, name, ... }
    // attendanceData: Array of attendance records

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Attendance')

    // Helper to get all dates in range
    const getDatesInRange = (start, end) => {
        const dates = []
        let current = new Date(start)
        while (current <= end) {
            dates.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }
        return dates
    }

    const days = getDatesInRange(startDate, endDate)
    const reportTitle = `Attendance Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`

    // --- HEADERS ---

    // Row 1: Company Name & Report Title
    worksheet.mergeCells('A1:B1')
    const companyCell = worksheet.getCell('A1')
    companyCell.value = 'Autoteknic'
    companyCell.font = { bold: true, size: 14 }
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Borders for A1:B1
    worksheet.getCell('A1').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    worksheet.getCell('B1').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }


    // Merge remaining columns for Title
    const lastColLetter = worksheet.getColumn(employees.length + 1).letter // +1 because Date is col 1
    if (employees.length > 1) {
        worksheet.mergeCells(`C1:${lastColLetter}1`)
    }
    const titleCell = worksheet.getCell('C1')
    titleCell.value = reportTitle
    titleCell.font = { bold: true, size: 12 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Borders for title row
    for (let i = 3; i <= employees.length + 1; i++) {
        const cell = worksheet.getCell(1, i)
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    }


    // Row 2: Column Headers
    const headerRow = worksheet.getRow(2)
    headerRow.getCell(1).value = 'DATE'
    headerRow.getCell(1).font = { bold: true }
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } } // Light Green
    headerRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }

    // Employee Names
    employees.forEach((emp, index) => {
        const cell = headerRow.getCell(index + 2) // Start from B
        cell.value = (emp.name || emp.email).toUpperCase()
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'center' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } } // Light Green
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    // --- DATA ROWS ---

    days.forEach((day, dayIndex) => {
        const row = worksheet.getRow(dayIndex + 3)
        const dateCell = row.getCell(1)

        // Date Formatting: d-MMM-yy
        // Date Formatting: 20th Dec 2025
        const dayNum = day.getDate()
        const monthStr = day.toLocaleString('default', { month: 'short' })
        const yearStr = day.getFullYear()

        const suffix = (d) => {
            if (d > 3 && d < 21) return 'th'
            switch (d % 10) {
                case 1: return 'st'
                case 2: return 'nd'
                case 3: return 'rd'
                default: return 'th'
            }
        }

        dateCell.value = `${dayNum}${suffix(dayNum)} ${monthStr} ${yearStr}`
        dateCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        dateCell.alignment = { horizontal: 'center' }

        const isSunday = day.getDay() === 0
        let isHoliday = false

        // Fill Employee Data
        employees.forEach((emp, empIndex) => {
            const cell = row.getCell(empIndex + 2)

            // Find attendance for this employee on this day
            const dateKey = day.toISOString().split('T')[0]

            const record = attendanceData.find(r =>
                r.date === dateKey && r.employeeEmail === emp.email
            )

            let status = ''
            if (record) {
                if (record.status === 'approved') status = record.location === 'office' ? 'OFFICE' : 'SITE'
                else if (record.status === 'pending') status = 'PENDING'
            }

            if (isSunday) {
                status = 'H'
                isHoliday = true
            }

            // Logic for Leave (if status is 'leave' or similar)
            if (record && record.status === 'leave') {
                status = 'L'
            }

            cell.value = status
            cell.alignment = { horizontal: 'center' }
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }

            // Styling: Green for Leave
            if (status === 'L') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } } // Green
            }
        })

        // Styling: Yellow Row for Sunday/Holiday
        if (isSunday || isHoliday) {
            for (let i = 1; i <= employees.length + 1; i++) {
                const cell = row.getCell(i)
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } // Yellow
                if (cell.value === 'H') {
                    cell.font = { bold: true }
                }
            }
        }
    })

    // Adjust Column Widths
    worksheet.getColumn(1).width = 15
    employees.forEach((_, i) => {
        worksheet.getColumn(i + 2).width = 20
    })

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Attendance_Report.xlsx`)
}
