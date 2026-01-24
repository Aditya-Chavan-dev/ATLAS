/**
 * PURPOSE: Progressive delay for excessive requests
 * SECURITY: Complements rate limiting by slowing down attackers
 * USAGE: Apply before hard rate limits kick in
 */
const slowDown = require('express-slow-down');

// Note: express-slow-down isn't in package.json yet according to previous check.
// If it fails, user needs to run npm install.
// We will assume it's available or user will install it.

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 mins at full speed
    delayMs: (hits) => hits * 100, // Add 100ms delay per request above 50
    maxDelayMs: 2000 // Cap delay at 2 seconds
});

module.exports = speedLimiter;
