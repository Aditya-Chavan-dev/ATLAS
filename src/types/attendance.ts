export type AttendanceStatusType = 'pending' | 'approved' | 'rejected';

export const AttendanceStatus = {
    PENDING: 'pending' as AttendanceStatusType,
    APPROVED: 'approved' as AttendanceStatusType,
    REJECTED: 'rejected' as AttendanceStatusType
} as const;

export type LocationType = 'office' | 'site';

export interface AttendanceRecord {
    uid: string;
    name: string;
    photoURL: string;
    type: LocationType;
    siteName?: string;
    status: AttendanceStatusType;
    timestamp: number;
    rejectionReason?: string;
    approvedAt?: number;
    actedAt?: number;
    actorId?: string;
}
