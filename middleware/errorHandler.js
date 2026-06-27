const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    // Log critical errors to file
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\nError: ${err.message}\nStack: ${err.stack}\nUser: ${req.user?.email || 'Anonymous'}\nIP: ${req.ip}\n---\n`;
    fs.appendFileSync(path.join(logDir, 'error.log'), logEntry);

    // Log to database for critical errors
    if (err.statusCode >= 500) {
        try {
            pool.execute(
                'INSERT INTO audit_logs (email, role, action, type, status, description, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user?.email || 'system', req.user?.role || 'system', 'SYSTEM_ERROR', 'system', 'error', 
                 err.message.substring(0, 200), req.ip]
            );
        } catch (dbError) {}
    }

    // Standard API error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal Server Error' : err.message,
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

module.exports = { errorHandler, notFoundHandler };