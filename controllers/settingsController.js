const SystemSetting = require('../models/SystemSetting');
const AuditLogModel = require('../models/AuditLogModel');
const { body, validationResult } = require('express-validator');

const settingsController = {
    // ====================================
    // GET CURRENT SETTINGS
    // ====================================
    getSettings: async (req, res) => {
        try {
            const settings = await SystemSetting.getSettings();
            if (!settings) {
                return res.status(404).json({ message: 'Settings not found. Please initialize system settings.' });
            }

            // Log the view action
            await AuditLogModel.create({
                email: req.query.email || 'system',
                role: 'super_admin',
                action: 'SETTINGS_VIEWED',
                type: 'system',
                status: 'success',
                description: 'System settings viewed',
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({ settings });
        } catch (error) {
            console.error('Get Settings Error:', error);
            res.status(500).json({ message: 'Server error fetching settings.' });
        }
    },

    // ====================================
    // UPDATE GENERAL SETTINGS
    // ====================================
    updateSettings: [
        // Validation
        body('system_name').trim().notEmpty().withMessage('System name is required.'),
        body('organization_name').trim().notEmpty().withMessage('Organization name is required.'),
        body('contact_email').isEmail().withMessage('Valid contact email is required.'),
        body('contact_phone').trim().notEmpty().withMessage('Contact phone is required.'),

        async (req, res) => {
            // Check validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const oldSettings = await SystemSetting.getSettings();
                const { system_name, organization_name, contact_email, contact_phone, system_address, website_url, description, updated_by, email } = req.body;

                // Handle logo upload
                const logo = req.file ? `/uploads/profiles/${req.file.filename}` : null;

                const updated = await SystemSetting.updateSettings({
                    system_name,
                    organization_name,
                    contact_email,
                    contact_phone,
                    system_address,
                    website_url,
                    description,
                    logo,
                    updated_by: updated_by || 1
                });

                if (!updated) {
                    return res.status(500).json({ message: 'Failed to update settings.' });
                }

                // Track what changed for audit log
                const changes = [];
                if (system_name !== oldSettings.system_name) changes.push(`System Name: "${oldSettings.system_name}" → "${system_name}"`);
                if (organization_name !== oldSettings.organization_name) changes.push(`Organization: "${oldSettings.organization_name}" → "${organization_name}"`);
                if (contact_email !== oldSettings.contact_email) changes.push(`Contact Email updated`);
                if (contact_phone !== oldSettings.contact_phone) changes.push(`Contact Phone updated`);
                if (logo) changes.push('Logo updated');

                // Audit log
                await AuditLogModel.create({
                    email: email || 'superadmin@lams.com',
                    role: 'super_admin',
                    action: 'SETTINGS_UPDATED',
                    type: 'system',
                    status: 'success',
                    description: `System settings updated. Changes: ${changes.join(', ') || 'General update'}`,
                    old_values: oldSettings,
                    new_values: { system_name, organization_name, contact_email, contact_phone, system_address, website_url, description },
                    performed_by: updated_by || 1,
                    ip_address: req.ip,
                    browser: req.headers['user-agent']
                });

                const newSettings = await SystemSetting.getSettings();
                res.json({
                    message: 'Settings updated successfully.',
                    settings: newSettings
                });
            } catch (error) {
                console.error('Update Settings Error:', error);
                res.status(500).json({ message: 'Server error updating settings.' });
            }
        }
    ],

    // ====================================
    // UPDATE THEME
    // ====================================
    updateTheme: async (req, res) => {
        try {
            const { theme, updated_by, email } = req.body;

            if (!theme || !['light', 'dark'].includes(theme)) {
                return res.status(400).json({ message: 'Theme must be either "light" or "dark".' });
            }

            const oldSettings = await SystemSetting.getSettings();
            await SystemSetting.updateTheme(theme, updated_by || 1);

            // Audit log
            await AuditLogModel.create({
                email: email || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'THEME_CHANGED',
                type: 'system',
                status: 'success',
                description: `Default theme changed from "${oldSettings.default_theme}" to "${theme}"`,
                performed_by: updated_by || 1,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({
                message: `Theme changed to ${theme} successfully.`,
                theme
            });
        } catch (error) {
            console.error('Update Theme Error:', error);
            res.status(500).json({ message: 'Server error updating theme.' });
        }
    },

    // ====================================
    // UPDATE LANGUAGE
    // ====================================
    updateLanguage: async (req, res) => {
        try {
            const { language, updated_by, email } = req.body;

            if (!language || !['english', 'kiswahili'].includes(language)) {
                return res.status(400).json({ message: 'Language must be either "english" or "kiswahili".' });
            }

            const oldSettings = await SystemSetting.getSettings();
            await SystemSetting.updateLanguage(language, updated_by || 1);

            // Audit log
            await AuditLogModel.create({
                email: email || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'LANGUAGE_CHANGED',
                type: 'system',
                status: 'success',
                description: `Default language changed from "${oldSettings.default_language}" to "${language}"`,
                performed_by: updated_by || 1,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            res.json({
                message: `Language changed to ${language} successfully.`,
                language
            });
        } catch (error) {
            console.error('Update Language Error:', error);
            res.status(500).json({ message: 'Server error updating language.' });
        }
    },

    // ====================================
    // UPDATE NOTIFICATIONS
    // ====================================
    updateNotifications: async (req, res) => {
        try {
            const { notifications_enabled, email_notifications_enabled, announcement_notifications_enabled, updated_by, email } = req.body;

            const oldSettings = await SystemSetting.getSettings();
            await SystemSetting.updateNotifications({
                notifications_enabled,
                email_notifications_enabled,
                announcement_notifications_enabled,
                updated_by: updated_by || 1
            });

            // Track changes
            const changes = [];
            if (notifications_enabled !== undefined && notifications_enabled !== oldSettings.notifications_enabled) {
                changes.push(`System Notifications: ${notifications_enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (email_notifications_enabled !== undefined && email_notifications_enabled !== oldSettings.email_notifications_enabled) {
                changes.push(`Email Notifications: ${email_notifications_enabled ? 'Enabled' : 'Disabled'}`);
            }
            if (announcement_notifications_enabled !== undefined && announcement_notifications_enabled !== oldSettings.announcement_notifications_enabled) {
                changes.push(`Announcement Notifications: ${announcement_notifications_enabled ? 'Enabled' : 'Disabled'}`);
            }

            // Audit log
            await AuditLogModel.create({
                email: email || 'superadmin@lams.com',
                role: 'super_admin',
                action: 'NOTIFICATIONS_UPDATED',
                type: 'system',
                status: 'success',
                description: `Notification settings updated: ${changes.join(', ') || 'No changes detected'}`,
                old_values: {
                    notifications_enabled: oldSettings.notifications_enabled,
                    email_notifications_enabled: oldSettings.email_notifications_enabled,
                    announcement_notifications_enabled: oldSettings.announcement_notifications_enabled
                },
                new_values: { notifications_enabled, email_notifications_enabled, announcement_notifications_enabled },
                performed_by: updated_by || 1,
                ip_address: req.ip,
                browser: req.headers['user-agent']
            });

            const newSettings = await SystemSetting.getSettings();
            res.json({
                message: 'Notification settings updated successfully.',
                settings: {
                    notifications_enabled: newSettings.notifications_enabled,
                    email_notifications_enabled: newSettings.email_notifications_enabled,
                    announcement_notifications_enabled: newSettings.announcement_notifications_enabled
                }
            });
        } catch (error) {
            console.error('Update Notifications Error:', error);
            res.status(500).json({ message: 'Server error updating notifications.' });
        }
    }
};

module.exports = settingsController;