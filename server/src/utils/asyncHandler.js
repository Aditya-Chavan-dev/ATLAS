/**
 * Async Handler Wrapper
 * Eliminates try-catch blocks in controllers
 * @param {Function} fn - Async controller function
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
