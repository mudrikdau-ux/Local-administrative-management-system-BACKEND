const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
require('dotenv').config();

const verifyAdminToken = async (req, res, next) => {
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
        
        // Verify role is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

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

module.exports = { verifyAdminToken };