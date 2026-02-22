export type UserRole = 'employee' | 'md' | 'admin';

export interface AtlasUser {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    activeDeviceId: string | null;
    lastLogin: string; // ISO string
    isApproved: boolean;
}
