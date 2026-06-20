const Security = require('../models/Security');
const User = require('../models/User');
const AuditLogModel = require('../models/AuditLogModel');

const securityController = {
    // ====================================
    // DASHBOARD
    // ====================================
    getDashboard: async (req, res) => {
        try {
            const [stats, loginSuccessVsFailed, passwordResetsPerMonth, accountLockActivities, alertsBySeverity] = await Promise.all([
                Security.getDashboardStats(),
                Security.getLoginSuccessVsFailed(),
                Security.getPasswordResetsPerMonth(),
                Security.getAccountLockActivities(),
                Security.getAlertsBySeverity()
            ]);

            res.json({
                summary_cards: stats,
                charts: {
                    login_success_vs_failed: loginSuccessVsFailed,
                    password_resets_per_month: passwordResetsPerMonth,
                    account_lock_activities: accountLockActivities,
                    alerts_by_severity: alertsBySeverity
                }
            });
        } catch (error) {
            console.error('Security Dashboard Error:', error);
            res.status(500).json({ message: 'Server error fetching dashboard.' });
        }
    },

    // ====================================
    // LOGIN ACTIVITY
    // ====================================
    getLoginActivity: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { status, start_date, end_date } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (start_date && end_date) {
                filters.start_date = start_date;
                filters.end_date = end_date;
            }

            const data = await Security.getLoginActivity(page, limit, filters);
            res.json(data);
        } catch (error) {
            console.error('Login Activity Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // GET LOGIN DETAIL
    // ====================================
    getLoginDetail: async (req, res) => {
        try {
            const log = await Security.getLoginById(req.params.id);
            if (!log) {
                return res.status(404).json({ message: 'Login record not found.' });
            }
            res.json({ log });
        } catch (error) {
            console.error('Login Detail Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // SEARCH ACCOUNT
    // ====================================
    searchAccount: async (req, res) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }

            const account = await Security.searchAccount(email.trim());
            if (!account) {
                return res.status(404).json({ message: 'Account not found.' });
            }

            // Don't expose password
            delete account.password;

            res.json({ account });
        } catch (error) {
            console.error('Search Account Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // LOCK ACCOUNT
    // ====================================
    lockAccount: async (req, res) => {
        try {
            const { email, performed_by, performed_by_name } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }

            const account = await Security.searchAccount(email);
            if (!account) {
                return res.status(404).json({ message: 'Account not found.' });
            }

            if (account.status === 'locked') {
                return res.status(400).json({ message: 'Account is already locked.' });
            }

            if (account.role === 'super_admin') {
                return res.status(403).json({ message: 'Cannot lock a Super Admin account.' });
            }

            await Security.lockAccount(account.id);

            // Create security alert
            await Security.createAlert({
                user_id: account.id,
                email: account.email,
                role: account.role,
                action: 'ACCOUNT_LOCKED',
                type: 'account_locked',
                description: `Account locked by ${performed_by_name || 'Super Admin'}: ${account.email}`,
                severity: 'high',
                performed_by: performed_by || 1,
                performed_by_name: performed_by_name || 'Super Admin',
                ip_address: req.ip
            });

            // Audit log
            await AuditLogModel.create({
                email: performed_by_name || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'ACCOUNT_LOCKED',
                type: 'security',
                status: 'success',
                description: `Account locked: ${account.email} (${account.role})`,
                performed_by: performed_by || 1,
                ip_address: req.ip
            });

            // Update user status in users table
            await User.updateStatus(account.id, 'locked');

            res.json({ message: `Account ${account.email} has been locked.` });
        } catch (error) {
            console.error('Lock Account Error:', error);
            res.status(500).json({ message: 'Server error locking account.' });
        }
    },

    // ====================================
    // UNLOCK ACCOUNT
    // ====================================
    unlockAccount: async (req, res) => {
        try {
            const { email, performed_by, performed_by_name } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required.' });
            }

            const account = await Security.searchAccount(email);
            if (!account) {
                return res.status(404).json({ message: 'Account not found.' });
            }

            if (account.status !== 'locked') {
                return res.status(400).json({ message: 'Account is not locked.' });
            }

            await Security.unlockAccount(account.id);

            // Create security alert
            await Security.createAlert({
                user_id: account.id,
                email: account.email,
                role: account.role,
                action: 'ACCOUNT_UNLOCKED',
                type: 'account_unlocked',
                description: `Account unlocked by ${performed_by_name || 'Super Admin'}: ${account.email}`,
                severity: 'medium',
                performed_by: performed_by || 1,
                performed_by_name: performed_by_name || 'Super Admin',
                ip_address: req.ip
            });

            // Audit log
            await AuditLogModel.create({
                email: performed_by_name || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'ACCOUNT_UNLOCKED',
                type: 'security',
                status: 'success',
                description: `Account unlocked: ${account.email} (${account.role})`,
                performed_by: performed_by || 1,
                ip_address: req.ip
            });

            // Update user status in users table
            await User.updateStatus(account.id, 'active');

            res.json({ message: `Account ${account.email} has been unlocked.` });
        } catch (error) {
            console.error('Unlock Account Error:', error);
            res.status(500).json({ message: 'Server error unlocking account.' });
        }
    },

    // ====================================
    // GET SECURITY ALERTS
    // ====================================
    getAlerts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { type, severity, start_date, end_date } = req.query;

            const filters = {};
            if (type) filters.type = type;
            if (severity) filters.severity = severity;
            if (start_date && end_date) {
                filters.start_date = start_date;
                filters.end_date = end_date;
            }

            const data = await Security.getAlerts(page, limit, filters);
            res.json(data);
        } catch (error) {
            console.error('Alerts Error:', error);
            res.status(500).json({ message: 'Server error fetching alerts.' });
        }
    },

    // ====================================
    // MARK ALERT AS READ
    // ====================================
    markAlertRead: async (req, res) => {
        try {
            await Security.markAlertRead(req.params.id);
            res.json({ message: 'Alert marked as read.' });
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // FORCE LOGOUT USER (All sessions)
    // ====================================
    forceLogoutUser: async (req, res) => {
        try {
            const { user_id, email, performed_by_name, performed_by } = req.body;

            if (!user_id) {
                return res.status(400).json({ message: 'User ID is required.' });
            }

            const TokenBlacklist = require('../models/TokenBlacklist');
            await TokenBlacklist.removeAllForUser(user_id);

            // Audit log
            await AuditLogModel.create({
                email: performed_by_name || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'FORCE_LOGOUT',
                type: 'security',
                status: 'success',
                description: `Force logout executed for user ID: ${user_id}` + (email ? ` (${email})` : ''),
                performed_by: performed_by || 1,
                ip_address: req.ip
            });

            res.json({ message: 'All sessions terminated for this user.' });
        } catch (error) {
            console.error('Force Logout Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // GET ALL STATISTICS
    // ====================================
    getStatistics: async (req, res) => {
        try {
            const [stats, loginSuccessVsFailed, alertsBySeverity] = await Promise.all([
                Security.getDashboardStats(),
                Security.getLoginSuccessVsFailed(),
                Security.getAlertsBySeverity()
            ]);

            res.json({
                statistics: stats,
                charts: {
                    login_breakdown: loginSuccessVsFailed,
                    alert_severity: alertsBySeverity
                }
            });
        } catch (error) {
            console.error('Statistics Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    }
};

module.exports = securityController;