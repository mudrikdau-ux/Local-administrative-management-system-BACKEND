const Notification = require('../models/Notification');

const notificationService = {
    // Send notification to Super Admin
    notifySuperAdmin: async (title, message, type = 'system', severity = 'info', referenceModule = null, referenceId = null, icon = 'bell') => {
        try {
            // Get super admin user ID (first super admin)
            const pool = require('../config/db');
            const [superAdmins] = await pool.execute(
                "SELECT id FROM users WHERE role = 'super_admin' AND status = 'active' LIMIT 1"
            );

            if (superAdmins.length > 0) {
                await Notification.create({
                    user_id: superAdmins[0].id,
                    title,
                    message,
                    type,
                    severity,
                    reference_id: referenceId,
                    reference_module: referenceModule,
                    icon
                });
            }
        } catch (error) {
            console.error('Notification Service Error:', error.message);
        }
    },

    // Notify all admins
    notifyAllAdmins: async (title, message, type = 'admin', severity = 'info', referenceModule = null, referenceId = null, icon = 'bell') => {
        try {
            const pool = require('../config/db');
            const [admins] = await pool.execute(
                "SELECT id FROM users WHERE role = 'admin' AND status = 'active'"
            );

            for (const admin of admins) {
                await Notification.create({
                    user_id: admin.id,
                    title,
                    message,
                    type,
                    severity,
                    reference_id: referenceId,
                    reference_module: referenceModule,
                    icon
                });
            }
        } catch (error) {
            console.error('Notification Service Error:', error.message);
        }
    }
};

module.exports = notificationService;