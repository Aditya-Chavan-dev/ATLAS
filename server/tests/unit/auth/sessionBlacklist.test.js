const sessionBlacklistService = require('../../../src/auth/session-blacklist/sessionBlacklistService');
const auditLogger = require('../../../src/auth/audit/auditLogger');

jest.mock('../../../config/firebase');
jest.mock('../../../src/auth/audit/auditLogger');

describe('Session Blacklist Service', () => {
    beforeEach(() => {
        sessionBlacklistService.blacklist = new Map(); // Reset state
        jest.clearAllMocks();
    });

    test('blacklistUser should add user to in-memory map', async () => {
        const uid = 'bad-user';
        await sessionBlacklistService.blacklistUser(uid, 'suspended');

        expect(sessionBlacklistService.blacklist.has(uid)).toBe(true);
        expect(auditLogger.logSecurityEvent).toHaveBeenCalled();
    });

    test('isBlacklisted should return entry if not expired', async () => {
        const uid = 'bad-user';
        const futureTime = 10000;
        await sessionBlacklistService.blacklistUser(uid, 'suspended', futureTime);

        const result = await sessionBlacklistService.isBlacklisted(uid);
        expect(result).toBeTruthy();
        expect(result.reason).toBe('suspended');
    });

    test('isBlacklisted should auto-remove if expired', async () => {
        const uid = 'temporary-ban';
        // Add manually to simulate past expiration
        sessionBlacklistService.blacklist.set(uid, {
            reason: 'test',
            expiresAt: Date.now() - 1000
        });

        const result = await sessionBlacklistService.isBlacklisted(uid);
        expect(result).toBe(false);
        expect(sessionBlacklistService.blacklist.has(uid)).toBe(false);
    });

    test('removeFromBlacklist should remove user', async () => {
        const uid = 'forgiven-user';
        await sessionBlacklistService.blacklistUser(uid, 'banned');
        await sessionBlacklistService.removeFromBlacklist(uid);

        expect(sessionBlacklistService.blacklist.has(uid)).toBe(false);
    });
});
