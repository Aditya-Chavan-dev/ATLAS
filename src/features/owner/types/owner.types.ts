// Owner Module - Types
export type UserRole = 'employee' | 'manager' | 'hr' | 'md' | 'owner';

export interface AppUser {
    uid: string;
    email: string;
    name?: string; // Legacy field
    fullName?: string; // Legacy field
    displayName?: string; // Standard Firebase field
    photoURL?: string;
    role: UserRole;
    status: 'active' | 'suspended' | 'deleted';
    lastSeen?: string;
}

export interface RoleUpdateResponse {
    success: boolean;
    message: string;
}
