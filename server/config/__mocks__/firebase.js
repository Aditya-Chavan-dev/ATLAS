/* eslint-env jest */
const mockVerifyIdToken = jest.fn();
const mockRevokeRefreshTokens = jest.fn();
const mockOnce = jest.fn();
const mockUpdate = jest.fn();
const mockSet = jest.fn();
const mockPush = jest.fn();

const mockRef = jest.fn().mockReturnValue({
    once: mockOnce,
    update: mockUpdate,
    set: mockSet,
    push: mockPush,
    child: jest.fn().mockReturnThis()
});

const mockAdmin = {
    auth: jest.fn().mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
        revokeRefreshTokens: mockRevokeRefreshTokens
    }),
    database: jest.fn().mockReturnValue({
        ref: mockRef
    }),
    credential: {
        cert: jest.fn(),
        applicationDefault: jest.fn()
    },
    initializeApp: jest.fn()
};

// Add static property often used
mockAdmin.database.ServerValue = { TIMESTAMP: 123456789 };

const mockDb = {
    ref: mockRef
};

module.exports = {
    admin: mockAdmin,
    db: mockDb,
    // Expose mocks via a special property so tests can reset/assert them
    __mocks: {
        mockVerifyIdToken,
        mockRevokeRefreshTokens,
        mockOnce,
        mockUpdate,
        mockSet,
        mockPush,
        mockRef
    }
};
