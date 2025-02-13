const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    message: "Too many login attempts, please try again later"
});

const defaultLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500, // Limit each IP to 500 requests per window
    message: "Too many requests, please try again later"
});

module.exports = {
    loginLimiter,
    defaultLimiter
};