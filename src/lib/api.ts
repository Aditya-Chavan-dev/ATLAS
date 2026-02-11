import { auth } from '@/lib/firebase/config';

const API_URL = import.meta.env.VITE_API_URL;

// Security: Fail-fast if API URL not configured
if (!API_URL) {
    throw new Error('FATAL: VITE_API_URL environment variable not set. Cannot initialize API client.');
}

/**
 * Enhanced API Client with Security Hardening
 * 
 * Security Features:
 * - Request timeout (15s) prevents UI freeze attacks
 * - Error sanitization (no stack traces in production)
 * - Token refresh on 401 (handles expired tokens)
 * - Exponential backoff retry (prevents server overload)
 * - AbortController cleanup (prevents memory leaks)
 * 
 * Edge Cases Covered:
 * - Network timeout → Graceful error message
 * - Token expiration mid-request → Refresh and retry
 * - Server returns 503 (maintenance) → Don't spam retries
 * - User loses internet → Clear error message
 * - Multiple rapid failures → Exponential backoff
 * - Component unmounts during request → Abort signal cleanup
 */

interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 300,
    maxDelayMs: 3000
};

/**
 * Sleep utility for retry backoff
 */
const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (attempt: number, config: RetryConfig): number => {
    const delay = config.baseDelayMs * Math.pow(2, attempt);
    return Math.min(delay, config.maxDelayMs);
};

/**
 * Sanitize error messages for production
 */
const sanitizeError = (error: any): string => {
    // Development: Show full error for debugging
    if (import.meta.env.DEV) {
        if (!error) return 'Unknown error occurred';
        return error.message || error.toString();
    }

    if (!error) return 'Request failed. Please try again later.';

    // Production: Generic messages only (security)
    if (error.name === 'AbortError') {
        return 'Request timeout. Please check your internet connection and try again.';
    }

    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return 'Network error. Please check your connection.';
    }

    // Generic fallback (prevents information disclosure)
    return 'Request failed. Please try again later.';
};

/**
 * Main API Client with comprehensive error handling
 */
export const apiClient = async <T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    options?: {
        timeout?: number;
        retryConfig?: Partial<RetryConfig>;
        signal?: AbortSignal;
    }
): Promise<T> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Unauthorized: Please sign in to continue');
    }

    const timeout = options?.timeout || 15000; // Default 15s
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
        // Create AbortController for this attempt
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Get fresh token (handles expiration automatically)
            // Force refresh if we are retrying after a 401
            const forceRefresh = attempt > 0 && lastError?.message?.includes('401');
            const token = await user.getIdToken(forceRefresh);

            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined,
                // Combine external signal with timeout signal
                signal: options?.signal
                    ? AbortSignal.any([controller.signal, options.signal])
                    : controller.signal
            });

            // Cleanup timeout
            clearTimeout(timeoutId);

            // Parse response safely
            let data: any = null;
            const contentType = response.headers.get('content-type');

            // Handle 204 No Content
            if (response.status === 204) {
                return null as T;
            }

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.warn('Failed to parse JSON response:', parseError);
                    throw new Error('Invalid server response format');
                }
            } else {
                // Fallback: successful response but not JSON (e.g. text/plain)
                if (response.ok) {
                    try {
                        const text = await response.text();
                        data = { message: text };
                    } catch (e) {
                        data = { message: 'Request successful' };
                    }
                } else {
                    // Error response not JSON
                    try {
                        data = { message: await response.text() || response.statusText };
                    } catch (e) {
                        data = { message: response.statusText };
                    }
                }
            }

            // Handle HTTP errors
            if (!response.ok) {
                // 401: Token expired, retry with fresh token
                if (response.status === 401 && attempt < retryConfig.maxAttempts - 1) {
                    await sleep(getBackoffDelay(attempt, retryConfig));
                    lastError = new Error('Request failed with status 401'); // Trigger forceRefresh next loop
                    continue; // Retry with fresh token
                }

                // 4xx errors: Don't retry (client error)
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
                }

                // 5xx errors: Retry with backoff
                if (response.status >= 500 && attempt < retryConfig.maxAttempts - 1) {
                    await sleep(getBackoffDelay(attempt, retryConfig));
                    lastError = new Error(data.error || 'Server error');
                    continue; // Retry
                }

                // Final attempt failed
                throw new Error(data.error || data.message || 'API Request Failed');
            }

            // Success!
            return data as T;

        } catch (error: any) {
            clearTimeout(timeoutId); // Ensure timeout cleared on error

            // AbortError: Timeout or cancellation
            if (error.name === 'AbortError') {
                // External cancellation signal
                if (options?.signal?.aborted) {
                    throw new Error('Request cancelled');
                }

                // Timeout - retry if attempts remaining
                if (attempt < retryConfig.maxAttempts - 1) {
                    await sleep(getBackoffDelay(attempt, retryConfig));
                    lastError = error;
                    continue;
                }

                throw new Error('Request timeout. Please check your connection.');
            }

            // Network errors: Retry
            if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                if (attempt < retryConfig.maxAttempts - 1) {
                    await sleep(getBackoffDelay(attempt, retryConfig));
                    lastError = error;
                    continue;
                }
            }

            // Other errors: Don't retry
            lastError = error;
            break;
        }
    }

    // All retries exhausted
    const sanitized = sanitizeError(lastError);
    throw new Error(sanitized);
};

