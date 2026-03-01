export type UserRole = 'employee' | 'md';

export interface AtlasUser {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    activeDeviceId: string | null;
    lastLogin: string; // ISO string
    isApproved: boolean;
}
