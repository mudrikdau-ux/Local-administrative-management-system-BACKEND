const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

// Admin specific routes (MUST come before /api/admin)
const adminCitizensRoutes = require('./routes/adminCitizensRoutes');
const adminDocumentRoutes = require('./routes/adminDocumentRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');

// General admin routes (LAST among admin routes)
const adminRoutes = require('./routes/adminRoutes');

// Super Admin routes
const superAdminRoutes = require('./routes/superAdminRoutes');
const citizenMonitoringRoutes = require('./routes/citizenMonitoringRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const securityRoutes = require('./routes/securityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// ==========================================
// ROUTES — ORDER MATTERS!
// Specific routes BEFORE general routes
// ==========================================

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);

// Admin Specific Routes (BEFORE /api/admin)
app.use('/api/admin/citizens', adminCitizensRoutes);
app.use('/api/admin/documents', adminDocumentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);

// General Admin Route (LAST among admin)
app.use('/api/admin', adminRoutes);

// Super Admin Routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/super-admin/citizens', citizenMonitoringRoutes);
app.use('/api/super-admin/reports', reportRoutes);
app.use('/api/super-admin/audit-logs', auditLogRoutes);
app.use('/api/super-admin/settings', settingsRoutes);
app.use('/api/super-admin/security', securityRoutes);
app.use('/api/super-admin/profile', profileRoutes);
app.use('/api/super-admin/dashboard', dashboardRoutes);
app.use('/api/super-admin/notifications', notificationRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'LAMS API is running...' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});