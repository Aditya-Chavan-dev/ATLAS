/**
 * Admin SDK Protection Guard
 * 
 * CRITICAL SECURITY INVARIANT:
 * The Firebase Admin SDK must NEVER write to /demo/* paths.
 * Demo data is managed exclusively by client SDK with anonymous auth.
 * 
 * This guard enforces the isolation boundary and prevents accidental
 * contamination or privilege escalation via admin writes.
 */

class DemoPathViolationError extends Error {
    constructor(path) {
        super(`SEV-1: Admin SDK attempted to write to demo path: ${path}`)
        this.name = 'DemoPathViolationError'
        this.severity = 'SEV-1'
        this.path = path
    }
}

/**
 * Validates that a database path is not within the /demo/* namespace
 * @param {string} path - The database path to validate
 * @throws {DemoPathViolationError} if path starts with 'demo/' or '/demo/'
 */
function guardAgainstDemoWrite(path) {
    if (!path || typeof path !== 'string') {
        return // Safe: invalid paths will fail elsewhere
    }

    const normalizedPath = path.trim().replace(/^\//, '')

    if (normalizedPath.startsWith('demo/') || normalizedPath === 'demo') {
        const error = new DemoPathViolationError(path)

        // Log as SEV-1 incident
        console.error('🔥🔥🔥 CRITICAL SECURITY VIOLATION 🔥🔥🔥')
        console.error(`Admin SDK attempted write to demo path: ${path}`)
        console.error('Stack trace:', error.stack)
        console.error('This is a production-blocking invariant violation.')

        throw error
    }
}

/**
 * Wraps a Firebase Admin database reference to enforce demo path protection
 * @param {admin.database.Reference} dbRef - Firebase Admin database reference
 * @returns {Proxy} - Protected database reference
 */
function createProtectedAdminRef(dbRef) {
    return new Proxy(dbRef, {
        get(target, prop) {
            const original = target[prop]

            // Intercept write operations
            if (prop === 'set' || prop === 'update' || prop === 'push' || prop === 'transaction') {
                return function (...args) {
                    // Validate path from ref
                    const path = target.toString().split('.com/')[1] || ''
                    guardAgainstDemoWrite(path)
                    return original.apply(target, args)
                }
            }

            // Intercept child() calls
            if (prop === 'child') {
                return function (childPath) {
                    guardAgainstDemoWrite(childPath)
                    const childRef = original.call(target, childPath)
                    return createProtectedAdminRef(childRef)
                }
            }

            // Pass through other operations
            return typeof original === 'function'
                ? original.bind(target)
                : original
        }
    })
}

module.exports = {
    guardAgainstDemoWrite,
    createProtectedAdminRef,
    DemoPathViolationError
}
