const AdminSetting = require('../models/AdminSettingModel');
const AuditLogModel = require('../models/AuditLogModel');

const adminSettingsController = {
    // ====================================
    // GET CURRENT SETTINGS
    // ====================================
    getSettings: async (req, res) => {
        try {
            const adminId = req.user.admin_id;

            if (!adminId) {
                return res.status(400).json({ success: false, message: 'Admin ID not found in session.' });
            }

            const settings = await AdminSetting.getByAdminId(adminId);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'SETTINGS_VIEWED',
                type: 'system',
                status: 'success',
                description: 'Admin viewed their settings',
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                data: {
                    language: settings.language === 'english' ? 'English' : 'Kiswahili',
                    theme: settings.theme === 'light' ? 'Light' : 'Dark',
                    email_notifications: settings.email_notifications
                }
            });
        } catch (error) {
            console.error('Get Settings Error:', error);
            res.status(500).json({ success: false, message: 'Server error fetching settings.' });
        }
    },

    // ====================================
    // UPDATE SETTINGS
    // ====================================
    updateSettings: async (req, res) => {
        try {
            const adminId = req.user.admin_id;

            if (!adminId) {
                return res.status(400).json({ success: false, message: 'Admin ID not found in session.' });
            }

            const { language, theme, email_notifications } = req.body;

            // Validate language
            if (language && !['english', 'kiswahili'].includes(language.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Invalid language. Choose "English" or "Kiswahili".' });
            }

            // Validate theme
            if (theme && !['light', 'dark'].includes(theme.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Invalid theme. Choose "Light" or "Dark".' });
            }

            // Validate email_notifications
            if (email_notifications !== undefined && typeof email_notifications !== 'boolean') {
                return res.status(400).json({ success: false, message: 'Invalid value for email notifications. Use true or false.' });
            }

            // Get current settings for comparison
            const currentSettings = await AdminSetting.getByAdminId(adminId);

            // Prepare update data
            const updateData = {};
            if (language) updateData.language = language.toLowerCase();
            if (theme) updateData.theme = theme.toLowerCase();
            if (email_notifications !== undefined) updateData.email_notifications = email_notifications;

            // Update settings
            const updated = await AdminSetting.update(adminId, updateData);

            if (!updated && Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'No valid settings provided.' });
            }

            // Track changes for audit
            const changes = [];
            if (language && language.toLowerCase() !== currentSettings.language) {
                changes.push(`Language: ${currentSettings.language} → ${language.toLowerCase()}`);
            }
            if (theme && theme.toLowerCase() !== currentSettings.theme) {
                changes.push(`Theme: ${currentSettings.theme} → ${theme.toLowerCase()}`);
            }
            if (email_notifications !== undefined && email_notifications !== currentSettings.email_notifications) {
                changes.push(`Email Notifications: ${currentSettings.email_notifications} → ${email_notifications}`);
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'SETTINGS_UPDATED',
                type: 'system',
                status: 'success',
                description: `Settings updated. Changes: ${changes.join(', ') || 'No changes detected'}`,
                old_values: currentSettings,
                new_values: updateData,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            // Return updated settings
            const updatedSettings = await AdminSetting.getByAdminId(adminId);

            res.json({
                success: true,
                message: 'Settings updated successfully.',
                data: {
                    language: updatedSettings.language === 'english' ? 'English' : 'Kiswahili',
                    theme: updatedSettings.theme === 'light' ? 'Light' : 'Dark',
                    email_notifications: updatedSettings.email_notifications
                }
            });
        } catch (error) {
            console.error('Update Settings Error:', error);
            res.status(500).json({ success: false, message: 'Server error updating settings.' });
        }
    },

    // ====================================
    // UPDATE LANGUAGE ONLY
    // ====================================
    updateLanguage: async (req, res) => {
        try {
            const adminId = req.user.admin_id;
            const { language } = req.body;

            if (!language || !['english', 'kiswahili'].includes(language.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Invalid language. Choose English or Kiswahili.' });
            }

            const currentSettings = await AdminSetting.getByAdminId(adminId);
            await AdminSetting.updateLanguage(adminId, language.toLowerCase());

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'LANGUAGE_CHANGED',
                type: 'system',
                status: 'success',
                description: `Language changed from ${currentSettings.language} to ${language.toLowerCase()}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: `Language changed to ${language}.` });
        } catch (error) {
            console.error('Update Language Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE THEME ONLY
    // ====================================
    updateTheme: async (req, res) => {
        try {
            const adminId = req.user.admin_id;
            const { theme } = req.body;

            if (!theme || !['light', 'dark'].includes(theme.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Invalid theme. Choose Light or Dark.' });
            }

            const currentSettings = await AdminSetting.getByAdminId(adminId);
            await AdminSetting.updateTheme(adminId, theme.toLowerCase());

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'THEME_CHANGED',
                type: 'system',
                status: 'success',
                description: `Theme changed from ${currentSettings.theme} to ${theme.toLowerCase()}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({ success: true, message: `Theme changed to ${theme}.` });
        } catch (error) {
            console.error('Update Theme Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // UPDATE NOTIFICATIONS ONLY
    // ====================================
    updateNotifications: async (req, res) => {
        try {
            const adminId = req.user.admin_id;
            const { enabled } = req.body;

            if (typeof enabled !== 'boolean') {
                return res.status(400).json({ success: false, message: 'Invalid value. Use true or false.' });
            }

            const currentSettings = await AdminSetting.getByAdminId(adminId);
            await AdminSetting.updateNotifications(adminId, enabled);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'NOTIFICATIONS_UPDATED',
                type: 'system',
                status: 'success',
                description: `Email notifications ${enabled ? 'enabled' : 'disabled'}`,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: `Email notifications ${enabled ? 'enabled' : 'disabled'}.`
            });
        } catch (error) {
            console.error('Update Notifications Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminSettingsController;