const { z } = require('zod');

/**
 * Zod Schema Validation Middleware
 * 
 * Usage: 
 *   router.post('/login', validate(loginSchema), authController.login);
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against (body, query, params)
 */
const validate = (schema) => (req, res, next) => {
    try {
        // Parse matches schema against (req.body + req.query + req.params fallback strategy or just body?)
        // Standard convention: Validate what the schema expects.
        // For strict API inputs, we usually validate req.body.

        // Strategy: If schema is a ZodObject, we can check for specific keys 'body', 'query', 'params'
        // But simpler strategy: Assume schema validates req.body by default unless wrapped.

        // Let's support separated validation: schema can be { body: Zod, query: Zod } or just Zod (for body).

        if (schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
            // It's a structured schema
            if (schema.shape.body) req.body = schema.shape.body.parse(req.body);
            if (schema.shape.query) req.query = schema.shape.query.parse(req.query);
            if (schema.shape.params) req.params = schema.shape.params.parse(req.params);
        } else {
            // Default to body validation
            req.body = schema.parse(req.body);
        }

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.warn('[Validation] Invalid input:', JSON.stringify(error.errors));
            return res.status(400).json({
                error: 'Validation Failed',
                code: 'VALIDATION_ERROR',
                details: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        next(error);
    }
};

module.exports = validate;
