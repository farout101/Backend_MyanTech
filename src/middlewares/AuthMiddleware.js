const jwt = require('jsonwebtoken')

const AuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!authHeader) {
        return res.status(400).json({ message: 'Authorization header is missing' });
    }

    if (!token) {
        return res.status(400).json({ message: 'Token needs to be provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decodeValue) => {
        if (error) {
            return res.status(401).json({ message: 'Unauthenticated Token' });
        } else {
            req.user = decodeValue;
            next();
        }
    });
};

module.exports = AuthMiddleware