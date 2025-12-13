const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com'; // Default to Render if not set

class ApiService {
    static async request(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };

        try {
            const config = { method, headers };
            if (body) config.body = JSON.stringify(body);

            // Allow endpoint to include or exclude leading slash
            const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

            const response = await fetch(`${API_URL}${normalizedEndpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }

            return data;
        } catch (error) {
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
