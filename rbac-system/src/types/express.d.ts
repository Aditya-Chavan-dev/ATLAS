import { Request } from 'express';

declare global {
    namespace Express {
        export interface Request {
            user?: {
                id: string; // Postgres UUID
                email: string;
                firebaseUid: string;
                role: 'Owner' | 'MD' | 'HR' | 'Employee';
                roleVersion: number;
                isRootOwner: boolean;
            };
        }
    }
}
