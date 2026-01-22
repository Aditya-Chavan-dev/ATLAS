# Excel Export Format Specification

> **Based on**: NOV 2025 ATTENDANCE.xlsx template  
> **Status**: 🔒 LOCKED

---

## Format Structure

### **Layout**
```
┌─────────────┬──────────────────────────────────────────────────────┬─────────────┐
│ Autoteknic  │         Attendance Nov 2025                          │             │
├─────────────┼──────────┬──────────┬──────────┬──────────┬───────────┼─────────────┤
│    DATE     │   RVS    │   GBC    │  SDS Sr  │   PAVAN  │  SHUBHAM  │  BIRAJDAR   │
├─────────────┼──────────┼──────────┼──────────┼──────────┼───────────┼─────────────┤
│  1-Nov-25   │  OFFICE  │  OFFICE  │  OFFICE  │  OFFICE  │  OFFICE   │   OFFICE    │
│  2-Nov-25   │    H     │  OFFICE  │    H     │  OFFICE  │  OFFICE   │     H       │ ← Yellow
│  3-Nov-25   │  OFFICE  │  OFFICE  │  OFFICE  │  OFFICE  │  OFFICE   │   OFFICE    │
│ 11-Nov-25   │  OFFICE  │KTFL Chakan│ OFFICE  │KTFL Chakan│ OFFICE   │   OFFICE    │
│ 13-Nov-25   │  OFFICE  │ KTFL B   │  OFFICE  │    L     │  OFFICE   │   OFFICE    │ ← L is green
│ 16-Nov-25   │    H     │    H     │    H     │    H     │    H      │     H       │ ← Yellow
└─────────────┴──────────┴──────────┴──────────┴──────────┴───────────┴─────────────┘
```

---

## Detailed Specifications

### **1. Header Section**

#### **Row 1: Company Name + Title**
- **Cell A1**: "Autoteknic" (company name)
- **Cells B1-F1** (merged): "Attendance {Month} {Year}" (e.g., "Attendance Nov 2025")
- **Font**: Regular (not bold)
- **Alignment**: Center

#### **Row 2: Column Headers**
- **Cell A2**: "DATE"
- **Cells B2 onwards**: Employee names (manual order defined by owner/MD)
- **Font**: **Bold**
- **Alignment**: Center

---

### **2. Date Column (Column A)**

#### **Format**: "D-MMM-YY"
- Examples: "1-Nov-25", "2-Nov-25", "30-Nov-25"
- **Not**: "01-Nov-25" (no leading zero)
- **Not**: "1" (day number only)

#### **Rows**: One row per day of the month
- November: 30 rows (1-Nov to 30-Nov)
- February: 28 or 29 rows (leap year aware)

---

### **3. Employee Columns (B onwards)**

#### **Column Headers**: Employee names
- **Order**: Manual (defined by owner/MD in settings)
- **Include**: All employees + MD + Owner
- **Format**: Display name (e.g., "RVS", "GBC", "SDS Sr")

---

### **4. Cell Values**

#### **Approved Attendance**:
- **Office**: "OFFICE" (uppercase)
- **Site**: Site name (e.g., "KTFL Chakan", "KTFL B", "RLJ ENGG.", "CIE INDIA")
- **Leave**: "L" (uppercase, green background)
- **Holiday**: "H" (uppercase, yellow background for entire row)

#### **Pending/Rejected** (NOT shown):
- Only **approved** attendance appears in Excel
- Pending attendance: Cell is **empty**
- Rejected attendance: Cell is **empty**

#### **Absent** (No attendance marked):
- Cell is **empty** (blank)

---

### **5. Color Coding**

#### **Yellow Background** (Sundays/Holidays):
- **Entire row** gets yellow background
- **Cell value**: "H"
- **RGB**: #FFFF00 or Excel "Yellow"
- **Applies to**: Sundays (auto-detected)

#### **Green Background** (Leaves):
- **Individual cell** gets green background
- **Cell value**: "L"
- **RGB**: #90EE90 or Excel "Light Green"
- **Applies to**: Approved leave requests only

#### **No Background** (Regular attendance):
- **Cell value**: "OFFICE" or site name
- **Background**: White/default

---

### **6. Formatting Rules**

#### **Fonts**:
- **Headers (Row 2)**: Bold
- **All other cells**: Regular (not bold)
- **Font family**: Arial or Calibri (Excel default)
- **Font size**: 11pt

#### **Borders**:
- **All cells**: Thin borders (grid)
- **Header row**: Slightly thicker bottom border

#### **Column Widths**:
- **DATE column**: Auto-fit to "DD-MMM-YY" format (~12 characters)
- **Employee columns**: Auto-fit to longest value (site name or "OFFICE")
- **Minimum width**: 10 characters

#### **Alignment**:
- **Headers**: Center
- **DATE column**: Center
- **Employee columns**: Center

---

### **7. File Generation**

#### **File Name Format**:
- **Pattern**: "{MONTH} {YEAR} ATTENDANCE.xlsx"
- **Examples**: 
  - "JAN 2026 ATTENDANCE.xlsx"
  - "FEB 2026 ATTENDANCE.xlsx"
  - "DEC 2025 ATTENDANCE.xlsx"
- **Month**: Uppercase, 3-letter abbreviation (JAN, FEB, MAR, etc.)
- **Year**: 4 digits

#### **Sheet Name**:
- **Default**: "Sheet1" or "Attendance"

#### **Export Trigger**:
- **Who**: MD or Owner
- **When**: On-demand (click "Export Report" button)
- **Month Selection**: Dropdown to select month + year

---

### **8. Data Rules**

#### **Only Approved Data**:
- ✅ Include: Approved attendance
- ✅ Include: Approved leaves
- ✅ Include: Holidays (Sundays)
- ❌ Exclude: Pending attendance
- ❌ Exclude: Rejected attendance

#### **Employee Order**:
- **Manual**: Owner/MD defines order in settings
- **Persisted**: Order saved in `/config/employee_order`
- **Default**: Alphabetical by name if no order defined

#### **Date Range**:
- **Full month**: Always export entire month (1st to last day)
- **Partial data**: If month not complete, future dates show empty cells

---

### **9. Implementation (ExcelJS)**

```typescript
import ExcelJS from 'exceljs';

async function generateAttendanceExcel(month: string, year: number) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');
  
  // Row 1: Company name + Title
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'Autoteknic';
  worksheet.mergeCells('B1:F1');
  worksheet.getCell('B1').value = `Attendance ${month} ${year}`;
  worksheet.getCell('B1').alignment = { horizontal: 'center' };
  
  // Row 2: Headers
  worksheet.getCell('A2').value = 'DATE';
  worksheet.getCell('A2').font = { bold: true };
  
  const employees = await getEmployeesInOrder(); // Manual order
  employees.forEach((emp, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D...
    worksheet.getCell(`${col}2`).value = emp.name;
    worksheet.getCell(`${col}2`).font = { bold: true };
    worksheet.getCell(`${col}2`).alignment = { horizontal: 'center' };
  });
  
  // Data rows
  const daysInMonth = getDaysInMonth(month, year);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, getMonthNumber(month), day);
    const rowNum = day + 2; // +2 for header rows
    
    // Date column
    worksheet.getCell(`A${rowNum}`).value = formatDate(date); // "1-Nov-25"
    
    // Check if Sunday
    const isSunday = date.getDay() === 0;
    if (isSunday) {
      // Yellow background for entire row
      for (let col = 0; col < employees.length + 1; col++) {
        const cellRef = String.fromCharCode(65 + col) + rowNum;
        worksheet.getCell(cellRef).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Yellow
        };
      }
      
      // Set "H" for all employees
      employees.forEach((emp, index) => {
        const col = String.fromCharCode(66 + index);
        worksheet.getCell(`${col}${rowNum}`).value = 'H';
      });
    } else {
      // Regular day - fetch attendance
      employees.forEach(async (emp, index) => {
        const col = String.fromCharCode(66 + index);
        const attendance = await getApprovedAttendance(emp.uid, date);
        
        if (attendance) {
          if (attendance.status === 'leave') {
            worksheet.getCell(`${col}${rowNum}`).value = 'L';
            worksheet.getCell(`${col}${rowNum}`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' } // Light green
            };
          } else {
            worksheet.getCell(`${col}${rowNum}`).value = attendance.location;
          }
        }
        // Else: empty cell (pending/rejected/absent)
      });
    }
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 12; // Minimum width
  });
  
  // Borders
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
```

---

## Summary

**File**: `{MONTH} {YEAR} ATTENDANCE.xlsx`  
**Layout**: Company name + Title | DATE column | Employee columns (manual order)  
**Data**: Approved attendance only (OFFICE, site names, L, H)  
**Colors**: Yellow for Sundays, Green for leaves  
**Fonts**: Bold headers, regular data  
**Include**: All employees + MD + Owner  

**Status**: 🔒 LOCKED - Ready for implementation
