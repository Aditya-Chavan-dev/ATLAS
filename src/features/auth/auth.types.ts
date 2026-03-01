// src/features/auth/auth.types.ts

export type UserRole = 'employee' | 'md' | 'owner';

export interface AtlasUser {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
    isWhitelisted: boolean;
}

export type AuthStatus =
    | 'loading'
    | 'authenticated'
    | 'unauthenticated'
    | 'access-denied';
