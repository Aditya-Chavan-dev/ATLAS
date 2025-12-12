const ExcelJS = require('exceljs');
const admin = require('../config/firebase');

const exportAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Fetch all employees
        const usersSnapshot = await admin.database().ref('users').once('value');
        const usersData = usersSnapshot.val() || {};

        const employees = Object.entries(usersData)
            .map(([uid, user]) => ({ uid, ...user }))
            .filter(u => u.role !== 'md' && u.role !== 'admin')
            .sort((a, b) => {
                const nameA = (a.name || a.email || '').toUpperCase();
                const nameB = (b.name || b.email || '').toUpperCase();
                // RVS first
                if (nameA.includes('RVS')) return -1;
                if (nameB.includes('RVS')) return 1;
                return nameA.localeCompare(nameB);
            });

        // Fetch all attendance records
        const attendanceSnapshot = await admin.database().ref('attendance').once('value');
        const attendanceData = attendanceSnapshot.val() || {};
        const attendanceRecords = Object.values(attendanceData);

        // Fetch all leaves
        const leavesSnapshot = await admin.database().ref('leaves').once('value');
        const leavesData = leavesSnapshot.val() || {};
        const allLeaves = [];
        Object.values(leavesData).forEach(userLeaves => {
            Object.values(userLeaves).forEach(leave => allLeaves.push(leave));
        });

        // Generate dates for the month
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const dates = [];
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(yearNum, monthNum - 1, day));
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');

        // Month name
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[monthNum - 1];

        // Row 1: Autoteknic
        worksheet.mergeCells(1, 1, 1, employees.length + 1);
        const titleCell = worksheet.getCell(1, 1);
        titleCell.value = 'Autoteknic';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Row 2: Attendance Month Year
        worksheet.mergeCells(2, 1, 2, employees.length + 1);
        const subtitleCell = worksheet.getCell(2, 1);
        subtitleCell.value = `Attendance ${monthName} ${yearNum}`;
        subtitleCell.font = { size: 14, bold: true };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Row 3: Headers
        const headerRow = worksheet.getRow(3);
        headerRow.getCell(1).value = 'DATE';
        headerRow.getCell(1).font = { bold: true };
        headerRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        employees.forEach((emp, index) => {
            const cell = headerRow.getCell(index + 2);
            cell.value = (emp.name || emp.email).toUpperCase();
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Data rows
        dates.forEach((date, dateIndex) => {
            const row = worksheet.getRow(dateIndex + 4);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;

            // Date column
            const dateCell = row.getCell(1);
            dateCell.value = `${date.getDate()}-${monthName}-${yearNum.toString().slice(-2)}`;
            dateCell.font = { bold: true, size: 11 };
            dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // Highlight Sunday dates in yellow
            if (isSunday) {
                dateCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF00' } // Yellow
                };
            }

            employees.forEach((emp, empIndex) => {
                const cell = row.getCell(empIndex + 2);
                const empName = (emp.name || '').toUpperCase();
                const isRVS = empName.includes('RVS');

                // Default font - BOLD everywhere
                cell.font = { bold: true, size: 10 };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };

                // RVS auto-marking logic
                if (isRVS) {
                    if (isSunday) {
                        cell.value = 'H';
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' } // Yellow for Sunday
                        };
                    } else {
                        cell.value = 'OFFICE';
                    }
                    return;
                }

                // Check for leave
                const leave = allLeaves.find(l => {
                    if (l.employeeEmail !== emp.email || l.status !== 'approved') return false;
                    const leaveStart = new Date(l.from);
                    const leaveEnd = new Date(l.to);
                    leaveStart.setHours(0, 0, 0, 0);
                    leaveEnd.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate >= leaveStart && checkDate <= leaveEnd;
                });

                if (isSunday) {
                    cell.value = 'H';
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF00' } // Yellow for Sunday
                    };
                } else if (leave) {
                    cell.value = 'L';
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF90EE90' } // Light green for leave
                    };
                } else {
                    // Check attendance record
                    const record = attendanceRecords.find(r =>
                        r.date === dateStr &&
                        (r.employeeEmail === emp.email || r.employeeId === emp.uid)
                    );

                    if (record && record.status === 'approved') {
                        if (record.location === 'office') {
                            cell.value = 'OFFICE';
                        } else if (record.location === 'site') {
                            cell.value = record.siteName ? record.siteName.toUpperCase() : 'SITE';
                        }
                    } else {
                        cell.value = '';
                    }
                }
            });
        });


        // Set column widths dynamically based on content
        worksheet.getColumn(1).width = 15; // Date column

        employees.forEach((emp, index) => {
            const empName = (emp.name || emp.email).toUpperCase();
            // Calculate width based on name length, minimum 12, maximum 25
            const nameLength = empName.length;
            const columnWidth = Math.max(12, Math.min(25, nameLength + 2));
            worksheet.getColumn(index + 2).width = columnWidth;
        });

        // Add borders to all cells with data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 3) { // From header row onwards
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                });
            }
        });

        // Set row heights for better visibility
        worksheet.getRow(1).height = 25; // Title row
        worksheet.getRow(2).height = 20; // Subtitle row
        worksheet.getRow(3).height = 20; // Header row


        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${monthName}_${yearNum}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
};

module.exports = { exportAttendanceReport };
