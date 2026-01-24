const unifiedAuthMiddleware = require('../../../src/auth/middleware/unifiedAuthMiddleware');
const blacklistService = require('../../../src/auth/session-blacklist/sessionBlacklistService');

// Setup singleton mocks within the factory scope
// Setup singleton mocks (uses __mocks__/firebase.js)
jest.mock('../../../config/firebase');

// Import the mocked module to access the spies
const firebaseMock = require('../../../config/firebase');
const { mockVerifyIdToken, mockOnce } = firebaseMock.__mocks;

jest.mock('../../../src/auth/session-blacklist/sessionBlacklistService');
jest.mock('../../../src/auth/audit/auditLogger');

describe('Unified Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('should reject missing token', async () => {
        await unifiedAuthMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    test('should reject blacklisted user', async () => {
        req.headers.authorization = 'Bearer valid-token';

        mockVerifyIdToken.mockResolvedValue({ uid: 'banned-uid' });
        blacklistService.isBlacklisted.mockResolvedValue({ reason: 'suspended' });

        await unifiedAuthMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_SESSION_BLOCKED' }));
    });

    test('should reject if profile status is not active', async () => {
        req.headers.authorization = 'Bearer valid-token';

        mockVerifyIdToken.mockResolvedValue({ uid: 'suspended-uid' });
        blacklistService.isBlacklisted.mockResolvedValue(false);

        mockOnce.mockResolvedValue({
            val: () => ({ status: 'suspended', role: 'EMPLOYEE' })
        });

        await unifiedAuthMiddleware(req, res, next);

        expect(blacklistService.blacklistUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_ACCOUNT_INACTIVE' }));
    });

    test('should allow active user with valid role', async () => {
        req.headers.authorization = 'Bearer valid-token';

        mockVerifyIdToken.mockResolvedValue({ uid: 'good-uid', email: 'test@example.com' });
        blacklistService.isBlacklisted.mockResolvedValue(false);

        mockOnce.mockResolvedValue({
            val: () => ({ status: 'active', role: 'EMPLOYEE' })
        });

        await unifiedAuthMiddleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.uid).toBe('good-uid');
        expect(req.user.role).toBe('EMPLOYEE');
        expect(next).toHaveBeenCalled();
    });
});
