const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const citizenMonitoringRoutes = require('./routes/citizenMonitoringRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const securityRoutes = require('./routes/securityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminCitizensRoutes = require('./routes/adminCitizensRoutes');
const adminDocumentRoutes = require('./routes/adminDocumentRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const adminAnnouncementRoutes = require('./routes/adminAnnouncementRoutes');
const adminMessageRoutes = require('./routes/adminMessageRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminProfileRoutes = require('./routes/adminProfileRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const { setupSocket } = require('./socket/socketHandler');
setupSocket(io);

// Make io accessible to routes
app.set('io', io);

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// ============================================
// ROUTES - ORDER MATTERS!
// Specific routes MUST come before generic routes
// ============================================

// Public Auth
app.use('/api/auth', authRoutes);

// Admin Auth (separate from admin panel)
app.use('/api/admin-auth', adminAuthRoutes);

// Admin Panel Routes (specific paths - MUST be before /api/admin)
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/citizens', adminCitizensRoutes);
app.use('/api/admin/documents', adminDocumentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/announcements', adminAnnouncementRoutes);
app.use('/api/admin/messages', adminMessageRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

// Generic admin/super-admin routes (catches /:id patterns - MUST be last)
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Super Admin Panel Routes
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO ready for real-time communication`);
});