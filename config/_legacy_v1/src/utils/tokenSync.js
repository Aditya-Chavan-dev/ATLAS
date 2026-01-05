import { set } from 'idb-keyval';

export const SYNC_TOKEN_KEY = 'atlas_fc_token';
export const SYNC_REFRESH_KEY = 'atlas_fc_refresh';

/**
 * Saves the latest Firebase Tokens to IndexedDB
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const syncTokenToSW = async (accessToken, refreshToken) => {
    try {
        if (accessToken) await set(SYNC_TOKEN_KEY, accessToken);
        if (refreshToken) await set(SYNC_REFRESH_KEY, refreshToken);
        // Clear if null (logout)
        if (!accessToken && !refreshToken) {
            await set(SYNC_TOKEN_KEY, null);
            await set(SYNC_REFRESH_KEY, null);
        }
    } catch (error) {
        console.error('[TokenSync] Failed to sync token:', error);
    }
};
