const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token has been invalidated. Please login again.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please login again.' });
        }
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = { verifyToken };