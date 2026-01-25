export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'pending' | 'rejected';
export type LeaveType = 'EL' | 'PL';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

// GPS Removed as per policy

export interface AttendanceRecord {
    id?: string;
    uid: string;
    date: string; // YYYY-MM-DD
    checkInTime: number;
    checkOutTime?: number;
    status: AttendanceStatus;
    // location: LocationData; // Removed
    notes?: string;
    rejectionReason?: string;
}

export interface LeaveRequest {
    id?: string;
    uid: string;
    startDate: number;
    endDate: number;
    type: LeaveType;
    reason: string;
    status: LeaveStatus;
    appliedAt: number;
    rejectionReason?: string;
}

export interface EmployeeStats {
    daysAttended: number; // Current Month
    lastAttendance?: number;
}
