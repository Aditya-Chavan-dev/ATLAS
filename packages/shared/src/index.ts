export const VERSION = '2.0.0';

export interface User {
    id: string;
    name: string;
    role: 'MD' | 'Employee' | 'Project_Admin';
}
