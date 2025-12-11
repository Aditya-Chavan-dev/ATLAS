import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

// Helper to get dates
const getDatesInRange = (start, end) => {
    const dates = []
    let current = new Date(start)
    current.setHours(0, 0, 0, 0)
    const endTime = new Date(end)
    endTime.setHours(0, 0, 0, 0)

    while (current <= endTime) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return dates
}

const formatDatePretty = (date) => {
    return format(date, 'd-MMM-yy')
}

// Special function to get header title for Excel
const getMonthYearTitle = (date) => {
    return `Attendance ${format(date, 'MMM yyyy')}`
}

export const generateMasterAttendanceReport = async (startDate, endDate, employees, attendanceData) => {
    const days = getDatesInRange(startDate, endDate)

    // Sort employees: Put RVS first if exists, then others alphabetical perhaps? 
    // User image shows: RVS, GBC, SDS Sr, SDS JUNIOR, PAVAN, SHUBHAM...
    // We will just use the order provided or sort alphabetically for now, but ensure RVS logic applies.

    // Identify RVS user - Assuming name starts with or contains 'RVS' case insensitive or specific ID. 
    // Since we don't have IDs mapping to "RVS", we'll verify if any employee name is "RVS".

    // Create Header Row
    // Row 1: Company Name
    // Row 2: Attendance Month Year
    // Row 3: Headers

    const employeeHeaders = employees.map(e => (e.name || e.email).toUpperCase())
    const headerRow = ['DATE', ...employeeHeaders]

    const dataRows = []

    days.forEach(day => {
        const row = [formatDatePretty(day)]
        const dateKey = day.toISOString().split('T')[0]
        const dayOfWeek = day.getDay()
        const isSunday = dayOfWeek === 0

        employees.forEach(emp => {
            const empName = (emp.name || '').toUpperCase()
            const isRVS = empName.includes('RVS')

            // Logic for RVS: Automarked as OFFICE (P) everyday except Sundays (H)
            if (isRVS) {
                if (isSunday) {
                    row.push('H')
                } else {
                    row.push('OFFICE') // Automarked
                }
                return // Skip normal check for RVS
            }

            // Normal Logic for others
            const record = attendanceData.find(r => r.date === dateKey && r.employeeEmail === emp.email)

            if (isSunday) {
                row.push('H') // Holiday
            } else if (record) {
                if (record.status === 'approved') {
                    if (record.location === 'office') {
                        row.push('OFFICE')
                    } else {
                        // If site, show Site Name if available, else SITE
                        // Image shows "KTFL Chakan", "RIJ ENGG" etc
                        row.push(record.siteName ? record.siteName.toUpperCase() : 'SITE')
                    }
                } else if (record.status === 'pending') {
                    row.push('?') // Pending
                } else if (record.status === 'leave') {
                    row.push('L') // Leave
                } else {
                    row.push('A') // Absent
                }
            } else {
                row.push('-') // Absent/No Record
            }
        })
        dataRows.push(row)
    })

    // Construct Sheet Data
    // Row 1: Autoteknic
    // Row 2: Attendance Nov 2025

    // We need to merge cells for the title rows. 
    // SheetJS (OSS) doesn't support styling or merges easily in the basic write/aoa, 
    // but we can add the merges to the worksheet object manually.

    const wsData = [
        ['Autoteknic'],
        [getMonthYearTitle(startDate)],
        headerRow,
        ...dataRows
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Merges
    // 's' = start, 'e' = end. r = row, c = col. 0-indexed.
    // Merge Row 0 from Col 0 to End
    const colCount = headerRow.length - 1
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount } }, // Row 1 across all cols
        { s: { r: 1, c: 0 }, e: { r: 1, c: colCount } }  // Row 2 across all cols
    ]

    // Basic Cell Styles not supported in free SheetJS. 
    // However, the data structure is robust.
    // If the user *really* needs colors, we'd need exceljs.
    // Given the build failure with exceljs previously, I will stick to xlsx for reliability of "downloading".
    // I will try to make the "content" as correct as possible. 
    // The user's specific request "Sheet must have... Autoteknic... Attendance Month..." is handled here.

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

    // Write File
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Attendance_${format(startDate, 'MMM_yyyy')}.xlsx`)
}

export const generateSingleEmployeeReport = async (startDate, endDate, employee, attendanceData, leavesData = []) => {
    const days = getDatesInRange(startDate, endDate)
    const empName = (employee.name || employee.email).toUpperCase()

    // Headers
    const headers = ['Date', 'Status', 'Location', 'Site Name', 'Time In', 'Time Out', 'Duration', 'Remarks']

    const dataRows = []

    days.forEach(day => {
        const dateKey = day.toISOString().split('T')[0]
        const record = attendanceData.find(r => r.date === dateKey && r.employeeEmail === employee.email) // Need to match by either email or UID in real app
        const isSunday = day.getDay() === 0

        let status = 'Absent'
        let location = '-'
        let siteName = '-'
        let timeIn = '-'
        let timeOut = '-'
        let duration = '-'
        let remarks = '-'

        if (isSunday) {
            status = 'Holiday'
        } else if (record) {
            if (record.clockInTime) timeIn = format(new Date(record.clockInTime), 'hh:mm a')
            if (record.clockOutTime) timeOut = format(new Date(record.clockOutTime), 'hh:mm a')
            if (record.duration) duration = record.duration
            if (record.remarks) remarks = record.remarks

            if (record.status === 'approved') {
                status = 'Present'
                location = record.location === 'office' ? 'Office' : 'Site'
                if (location === 'Site') siteName = record.siteName || '-'
            } else if (record.status === 'pending') {
                status = 'Pending'
            } else if (record.status === 'leave') {
                status = 'Leave'
            }
        }

        dataRows.push([
            formatDatePretty(day),
            status,
            location,
            siteName,
            timeIn,
            timeOut,
            duration,
            remarks
        ])
    })

    const wsData = [
        ['ATLAS EMPLOYEE REPORT'],
        [`Name: ${empName}`],
        [`Period: ${formatDatePretty(startDate)} - ${formatDatePretty(endDate)}`],
        [],
        headers,
        ...dataRows
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Report')

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${empName}_Report_${format(startDate, 'yyyy-MM-dd')}.xlsx`)
}
