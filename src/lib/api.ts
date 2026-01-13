import { auth } from '@/lib/firebase/config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = async <T = any>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated');

    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || data.message || 'API Request Failed');
    }

    return data;
};
