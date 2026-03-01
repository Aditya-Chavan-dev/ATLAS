// src/features/auth/auth.errors.ts

const firebaseErrorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Contact your administrator.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/not-whitelisted': 'Access denied. Your account has not been authorised. Contact your MD.',
};

export function getAuthErrorMessage(errorCode: string): string {
    return firebaseErrorMap[errorCode] ?? 'An unexpected error occurred. Please try again.';
}
