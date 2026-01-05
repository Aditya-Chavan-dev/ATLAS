// TypeScript types for authentication
import { User as FirebaseUser } from 'firebase/auth';

/**
 * User roles in the system
 */
export type UserRole = 'employee' | 'md';

/**
 * User status
 */
export type UserStatus = 'active' | 'disabled';

/**
 * Extended user type with custom claims
 */
export interface AuthUser extends FirebaseUser {
    role?: UserRole;
    tokenVersion?: number;
}

/**
 * User document in Firestore
 */
export interface UserDocument {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    token_version: number;
    created_at: string;
    updated_at: string;
}

/**
 * Custom claims in ID token
 */
export interface CustomClaims {
    role: UserRole;
    token_version: number;
}

/**
 * Authentication error types
 */
export type AuthErrorCode =
    | 'auth/popup-closed-by-user'
    | 'auth/unauthorized-domain'
    | 'auth/user-not-found'
    | 'auth/invalid-email'
    | 'auth/network-request-failed';

export interface AuthError {
    code: AuthErrorCode;
    message: string;
}
