import axios from 'axios';
import { auth } from '../config/firebase';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
    async (config) => {
        try {
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    console.error('Unauthorized: Please login again');
                    // Optionally redirect to login
                    // window.location.href = '/login';
                    break;
                case 403:
                    console.error('Forbidden: You do not have permission');
                    break;
                case 404:
                    console.error('Not found:', data.error || data.message);
                    break;
                case 500:
                    console.error('Server error:', data.error || data.message);
                    break;
                default:
                    console.error('API error:', data.error || data.message);
            }

            return Promise.reject({
                status,
                message: data.error || data.message || 'An error occurred',
                data
            });
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error: No response from server');
            return Promise.reject({
                status: 0,
                message: 'Network error: Please check your connection',
            });
        } else {
            // Error in request setup
            console.error('Request error:', error.message);
            return Promise.reject({
                status: 0,
                message: error.message || 'Request failed',
            });
        }
    }
);

export default api;
