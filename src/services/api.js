import { auth } from '../firebase/config';

const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com'; // Default to Render Production

/**
 * Retry configuration for network resilience
 * FAANG Principle: "Assume the network is unreliable."
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000, // 1s, 2s, 4s (exponential backoff)
    retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Rate Limit, Server Errors
}

/**
 * Sleep utility for delays between retries
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Get Firebase Auth token for API requests
 * @returns {Promise<string|null>} The ID token or null if not authenticated
 */
const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.warn('[API] No authenticated user for token');
        return null;
    }
    try {
        const token = await user.getIdToken(/* forceRefresh */ false);
        return token;
    } catch (error) {
        console.error('[API] Failed to get auth token:', error);
        return null;
    }
}

class ApiService {
    static async request(endpoint, method = 'GET', body = null, retryCount = 0) {
        const headers = { 'Content-Type': 'application/json' };

        // Add Authorization header with Firebase token
        const token = await getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const config = { method, headers };
            if (body) config.body = JSON.stringify(body);

            // Allow endpoint to include or exclude leading slash
            const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

            const response = await fetch(`${API_URL}${normalizedEndpoint}`, config);

            // Check if we should retry
            if (!response.ok && RETRY_CONFIG.retryableStatuses.includes(response.status)) {
                if (retryCount < RETRY_CONFIG.maxRetries) {
                    const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount)
                    console.warn(`[API] Retrying ${endpoint} in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
                    await sleep(delay)
                    return this.request(endpoint, method, body, retryCount + 1)
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }

            return data;
        } catch (error) {
            // Network errors (offline, DNS failure, etc.) - retry
            if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < RETRY_CONFIG.maxRetries) {
                const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount)
                console.warn(`[API] Network error, retrying ${endpoint} in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
                await sleep(delay)
                return this.request(endpoint, method, body, retryCount + 1)
            }

            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    static post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    }

    static get(endpoint) {
        return this.request(endpoint, 'GET');
    }
}

export default ApiService;

