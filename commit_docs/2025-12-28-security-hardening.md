# FEATURE_ENHANCEMENT

## What was the previous feature?
The backend was a standard Express server with basic `cors` and `rateLimit`. It lacked deep security headers and input sanitization defenses.

## What was enhanced?
We implemented "Banking-Grade" security middleware to harden the exposed API surface.

## Steps taken
1.  Installed `helmet`: Sets HTTP headers (HSTS, X-Content-Type-Options, etc.).
2.  Installed `hpp`: Prevents HTTP Parameter Pollution attacks.
3.  Installed `compression`: Improves performance.
4.  Created `validate.js`: A zero-trust schema validation middleware using `zod`.

## Why this approach?
Defense-in-depth. Instead of trusting the frontend, the backend now assumes everything is hostile. `helmet` forces browsers to behave securely, and `hpp` prevents DoS attacks via query param spam.

## Affected Files
- `backend/src/app.js`
- `backend/src/middleware/validate.js`
- `backend/package.json`
