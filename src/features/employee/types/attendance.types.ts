export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'pending' | 'rejected';
export type LeaveType = 'EL' | 'PL';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
}

export interface AttendanceRecord {
    id?: string;
    uid: string;
    date: string; // YYYY-MM-DD
    checkInTime: number;
    checkOutTime?: number;
    status: AttendanceStatus;
    location: LocationData;
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
    daysAttended: number;
    elBalance: number;
    plBalance: number;
    lastAttendance?: number;
}
