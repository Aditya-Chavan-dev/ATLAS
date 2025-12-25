const ExcelJS = require('exceljs');
const { admin, db } = require('../config/firebase');

const exportAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Fetch all employees from SSOT /employees path
        const employeesSnapshot = await db.ref('employees').once('value');
        const employeesData = employeesSnapshot.val() || {};

        // Extract employees with their attendance data
        const employees = Object.entries(employeesData)
            .map(([uid, data]) => {
                // Handle both nested profile structure and flat structure
                const profile = data.profile || data;
                return {
                    uid,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role,
                    status: profile.status,
                    attendance: data.attendance || {}
                };
            })
            // Filter only active employees (exclude inactive/terminated)
            .filter(emp => {
                // Include if status is explicitly 'active' OR status field doesn't exist (legacy active users)
                const isActive = !emp.status || emp.status === 'active';
                // Exclude owner role from export
                const isNotOwner = emp.role !== 'owner';
                return isActive && isNotOwner && emp.name && emp.email;
            })
            // Sort with exact MD-required ordering
            .sort((a, b) => {
                const emailA = (a.email || '').toLowerCase();
                const emailB = (b.email || '').toLowerCase();
                const nameA = (a.name || a.email || '').toUpperCase();
                const nameB = (b.name || b.email || '').toUpperCase();

                // 1. RVS (Auto-marked) - FIRST
                const isRvsA = nameA.includes('RVS');
                const isRvsB = nameB.includes('RVS');

                if (isRvsA && !isRvsB) return -1;
                if (!isRvsA && isRvsB) return 1;
                if (isRvsA && isRvsB) return 0;

                // Identify Santy (HR)
                const isSantyA = emailA === 'santy9shinde@gmail.com';
                const isSantyB = emailB === 'santy9shinde@gmail.com';

                // 2. Active MD - SECOND (ANY MD role that isn't Santy or RVS)
                const isRealMDA = a.role === 'md' && !isSantyA && !isRvsA;
                const isRealMDB = b.role === 'md' && !isSantyB && !isRvsB;

                if (isRealMDA && !isRealMDB) return -1;
                if (!isRealMDA && isRealMDB) return 1;
                if (isRealMDA && isRealMDB) return 0;

                // 3. HR (Santy) - THIRD
                if (isSantyA && !isSantyB) return -1;
                if (!isSantyA && isSantyB) return 1;
                if (isSantyA && isSantyB) return 0;

                // 4. Other active employees - ALPHABETICAL
                return nameA.localeCompare(nameB);
            });

        // Fetch all leaves
        const leavesSnapshot = await db.ref('leaves').once('value');

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

        // Row 1: Autoteknik (MD-approved spelling)
        worksheet.mergeCells(1, 1, 1, employees.length + 1);
        const titleCell = worksheet.getCell(1, 1);
        titleCell.value = 'Autoteknik';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Row 2: Attendance Month Year
        worksheet.mergeCells(2, 1, 2, employees.length + 1);
        const subtitleCell = worksheet.getCell(2, 1);
        subtitleCell.value = `Attendance ${monthName} ${yearNum}`;
        subtitleCell.font = { size: 14, bold: true };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Row 3: Headers (GREEN per MD reference)
        const headerRow = worksheet.getRow(3);
        headerRow.getCell(1).value = 'DATE';
        headerRow.getCell(1).font = { bold: true };
        headerRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF92D050' } // Excel green to match reference
        };

        employees.forEach((emp, index) => {
            const cell = headerRow.getCell(index + 2);
            cell.value = (emp.name || emp.email).toUpperCase();
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF92D050' } // Excel green to match reference
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
                    // Check attendance record from employee's embedded attendance data
                    const attendanceRecord = emp.attendance?.[dateStr];

                    if (attendanceRecord && attendanceRecord.status === 'Present') {
                        if (attendanceRecord.locationType === 'Office') {
                            cell.value = 'OFFICE';
                        } else if (attendanceRecord.locationType === 'Site') {
                            cell.value = attendanceRecord.siteName ? attendanceRecord.siteName.toUpperCase() : 'SITE';
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
