const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
require('dotenv').config();

const verifyCitizenToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been invalidated. Please login again.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify role is citizen
        if (decoded.role !== 'citizen') {
            return res.status(403).json({ success: false, message: 'Access denied. Citizen only.' });
        }

        req.user = decoded;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
        }
        res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

module.exports = { verifyCitizenToken };