const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
require('dotenv').config();

// ============================================
// IMPORT ROUTES
// ============================================

// Public Auth Routes
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const citizenAuthRoutes = require('./routes/citizenAuthRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Super Admin Panel Routes
const superAdminRoutes = require('./routes/superAdminRoutes');
const citizenMonitoringRoutes = require('./routes/citizenMonitoringRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const securityRoutes = require('./routes/securityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const backupRoutes = require('./routes/backupRoutes');

// Admin Panel Routes
const adminRoutes = require('./routes/adminRoutes');
const adminCitizensRoutes = require('./routes/adminCitizensRoutes');
const adminDocumentRoutes = require('./routes/adminDocumentRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const adminAnnouncementRoutes = require('./routes/adminAnnouncementRoutes');
const adminMessageRoutes = require('./routes/adminMessageRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminProfileRoutes = require('./routes/adminProfileRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');

// Citizen Panel Routes
const citizenRoutes = require('./routes/citizenRoutes');
const citizenModuleRoutes = require('./routes/citizenModuleRoutes');
const citizenProfileRoutes = require('./routes/citizenProfileRoutes');
const citizenDashboardRoutes = require('./routes/citizenDashboardRoutes');

// Advanced Feature Routes
const healthRoutes = require('./routes/healthRoutes');

// Error Handler
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Swagger
const setupSwagger = require('./config/swagger');

// ============================================
// APP SETUP
// ============================================

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
// SWAGGER API DOCUMENTATION
// ============================================
setupSwagger(app);

// ============================================
// ROUTES REGISTRATION
// ============================================

// Public Auth Routes (No Token Required)
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/citizen/auth', citizenAuthRoutes);
app.use('/api/public', publicRoutes);

// Citizen Panel Routes (Token Required)
app.use('/api/citizen', citizenRoutes);
app.use('/api/citizen', citizenModuleRoutes);
app.use('/api/citizen', citizenProfileRoutes);
app.use('/api/citizen/dashboard', citizenDashboardRoutes);

// Admin Panel Routes (Token Required)
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/citizens', adminCitizensRoutes);
app.use('/api/admin/documents', adminDocumentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/announcements', adminAnnouncementRoutes);
app.use('/api/admin/messages', adminMessageRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin', adminRoutes);

// Super Admin Panel Routes (Token Required)
app.use('/api/super-admin/citizens', citizenMonitoringRoutes);
app.use('/api/super-admin/reports', reportRoutes);
app.use('/api/super-admin/audit-logs', auditLogRoutes);
app.use('/api/super-admin/settings', settingsRoutes);
app.use('/api/super-admin/security', securityRoutes);
app.use('/api/super-admin/profile', profileRoutes);
app.use('/api/super-admin/dashboard', dashboardRoutes);
app.use('/api/super-admin/notifications', notificationRoutes);
app.use('/api/super-admin/backups', backupRoutes);
app.use('/api/super-admin', superAdminRoutes);

// System Health (Super Admin Only)
app.use('/api/system/health', healthRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'LAMS API is running...', version: '2.0.0', status: 'operational' });
});

// ============================================
// 404 HANDLER
// ============================================
app.use(notFoundHandler);

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// CREATE REQUIRED DIRECTORIES
// ============================================
const dirs = ['uploads/qrcodes', 'backups', 'logs'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================
// INITIALIZE CRON JOBS
// ============================================
const cronJobs = require('./jobs/cronJobs');
cronJobs.init();

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`🔌 Socket.IO ready for real-time communication`);
    console.log(`🕐 Cron Jobs initialized`);
});