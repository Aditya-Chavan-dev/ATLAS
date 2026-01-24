module.exports = {
    testEnvironment: 'node',
    verbose: true,
    // Helper to handle absolute paths if needed, though we used relative
    moduleFileExtensions: ['js', 'json', 'node'],
    // Ignore integration/performance tests for defaults? No, run all for now.
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
    coveragePathIgnorePatterns: [
        "/node_modules/"
    ]
};
