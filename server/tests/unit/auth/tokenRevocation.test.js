const tokenRevocationService = require('../../../src/auth/token-management/tokenRevocationService');
const auditLogger = require('../../../src/auth/audit/auditLogger');

jest.mock('../../../src/auth/audit/auditLogger');

// Singleton spy
// Singleton spy (uses __mocks__/firebase.js)
jest.mock('../../../config/firebase');

const firebaseMock = require('../../../config/firebase');
const { mockRevokeRefreshTokens } = firebaseMock.__mocks;

describe('Token Revocation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('revokeUserTokens should call firebase revocation', async () => {
        const uid = 'test-uid';
        const result = await tokenRevocationService.revokeUserTokens(uid, 'security_risk');

        // Use the singleton spy
        expect(mockRevokeRefreshTokens).toHaveBeenCalledWith(uid);

        expect(auditLogger.logSecurityEvent).toHaveBeenCalledWith(expect.objectContaining({
            action: 'revoke_tokens',
            uid,
            reason: 'security_risk'
        }));
        expect(result).toBe(true);
    });

    test('forceTokenRefresh should call revoke with specific reason', async () => {
        const uid = 'test-uid';
        await tokenRevocationService.forceTokenRefresh(uid);

        expect(mockRevokeRefreshTokens).toHaveBeenCalledWith(uid);
        expect(auditLogger.logSecurityEvent).toHaveBeenCalledWith(expect.objectContaining({
            reason: 'force_refresh_role_sync'
        }));
    });
});
