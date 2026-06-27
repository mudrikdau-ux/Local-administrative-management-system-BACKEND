const Notification = require('../models/Notification');

const notificationService = {
    // ====================================
    // NOTIFY SUPER ADMIN
    // ====================================
    notifySuperAdmin: async (title, message, type = 'system', severity = 'info', referenceModule = null, referenceId = null, icon = 'bell') => {
        try {
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

    // ====================================
    // NOTIFY ALL ADMINS
    // ====================================
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
    },

    // ====================================
    // NOTIFY A SPECIFIC ADMIN
    // ====================================
    notifyAdmin: async (adminId, title, message, type = 'admin', severity = 'info', referenceModule = null, referenceId = null, icon = 'bell') => {
        try {
            const pool = require('../config/db');
            const [admins] = await pool.execute(
                "SELECT user_id FROM admins WHERE id = ? AND status = 'active' LIMIT 1",
                [adminId]
            );

            if (admins.length > 0) {
                await Notification.create({
                    user_id: admins[0].user_id,
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

    // ====================================
    // NOTIFY A SPECIFIC CITIZEN
    // ====================================
    notifyCitizen: async (citizenId, title, message, type = 'system', severity = 'info', referenceModule = null, referenceId = null, icon = 'bell') => {
        try {
            const pool = require('../config/db');
            const [citizens] = await pool.execute(
                "SELECT user_id FROM citizens WHERE id = ? AND status = 'active' AND is_deleted = FALSE LIMIT 1",
                [citizenId]
            );

            if (citizens.length > 0 && citizens[0].user_id) {
                await Notification.create({
                    user_id: citizens[0].user_id,
                    title,
                    message,
                    type,
                    severity,
                    reference_id: referenceId,
                    reference_module: referenceModule,
                    icon
                });

                // Also store in citizen-specific notifications if table has citizen_id
                try {
                    const CitizenDashboard = require('../models/CitizenDashboard');
                    await CitizenDashboard.addNotification(citizenId, title, message, type, referenceId);
                } catch (e) {
                    // Citizen dashboard model might not be available yet
                }
            }
        } catch (error) {
            console.error('Notification Service Error:', error.message);
        }
    },

    // ====================================
    // NOTIFY ALL CITIZENS IN A WARD
    // ====================================
    notifyWardCitizens: async (wardId, title, message, type = 'announcement', severity = 'info', referenceModule = null, referenceId = null, icon = 'megaphone') => {
        try {
            const pool = require('../config/db');
            const [citizens] = await pool.execute(
                "SELECT id, user_id FROM citizens WHERE ward_id = ? AND status = 'active' AND is_deleted = FALSE",
                [wardId]
            );

            for (const citizen of citizens) {
                if (citizen.user_id) {
                    await Notification.create({
                        user_id: citizen.user_id,
                        title,
                        message,
                        type,
                        severity,
                        reference_id: referenceId,
                        reference_module: referenceModule,
                        icon
                    });

                    // Also add to citizen dashboard notifications
                    try {
                        const CitizenDashboard = require('../models/CitizenDashboard');
                        await CitizenDashboard.addNotification(citizen.id, title, message, type, referenceId);
                    } catch (e) {
                        // Citizen dashboard model might not be available
                    }
                }
            }
        } catch (error) {
            console.error('Notification Service Error:', error.message);
        }
    },

    // ====================================
    // ADD ACTIVITY TO CITIZEN DASHBOARD
    // ====================================
    addCitizenActivity: async (citizenId, activity, type, referenceId = null) => {
        try {
            const CitizenDashboard = require('../models/CitizenDashboard');
            await CitizenDashboard.addActivity(citizenId, activity, type, referenceId);
        } catch (error) {
            console.error('Add Activity Error:', error.message);
        }
    },

    // ====================================
    // ADD ACTIVITY TO ADMIN DASHBOARD
    // ====================================
    addAdminActivity: async (activity, type = 'system', description = null, performedBy = null) => {
        try {
            const AuditLogModel = require('../models/AuditLogModel');
            await AuditLogModel.create({
                email: 'system@lams.go.tz',
                role: 'admin',
                action: activity,
                type: type,
                status: 'success',
                description: description || activity,
                performed_by: performedBy
            });
        } catch (error) {
            console.error('Add Admin Activity Error:', error.message);
        }
    }
};

module.exports = notificationService;