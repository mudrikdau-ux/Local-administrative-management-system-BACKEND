const pool = require('../config/db');

const SystemSetting = {
    getSettings: async () => {
        const [rows] = await pool.execute('SELECT * FROM system_settings LIMIT 1');
        return rows[0];
    },

    updateSettings: async (data) => {
        const { system_name, organization_name, contact_email, contact_phone, system_address, website_url, description, logo, updated_by } = data;
        const [result] = await pool.execute(
            `UPDATE system_settings SET 
                system_name = ?, organization_name = ?, contact_email = ?, contact_phone = ?, 
                system_address = COALESCE(?, system_address), website_url = COALESCE(?, website_url),
                description = COALESCE(?, description), logo = COALESCE(?, logo), updated_by = ?
             WHERE id = 1`,
            [system_name, organization_name, contact_email, contact_phone,
             system_address || null, website_url || null, description || null,
             logo || null, updated_by || null]
        );
        return result.affectedRows > 0;
    },

    updateTheme: async (theme, updated_by) => {
        const [result] = await pool.execute(
            'UPDATE system_settings SET default_theme = ?, updated_by = ? WHERE id = 1',
            [theme, updated_by || null]
        );
        return result.affectedRows > 0;
    },

    updateLanguage: async (language, updated_by) => {
        const [result] = await pool.execute(
            'UPDATE system_settings SET default_language = ?, updated_by = ? WHERE id = 1',
            [language, updated_by || null]
        );
        return result.affectedRows > 0;
    },

    updateNotifications: async (data) => {
        const { notifications_enabled, email_notifications_enabled, announcement_notifications_enabled, updated_by } = data;
        const [result] = await pool.execute(
            `UPDATE system_settings SET 
                notifications_enabled = COALESCE(?, notifications_enabled),
                email_notifications_enabled = COALESCE(?, email_notifications_enabled),
                announcement_notifications_enabled = COALESCE(?, announcement_notifications_enabled),
                updated_by = ?
             WHERE id = 1`,
            [
                notifications_enabled !== undefined ? notifications_enabled : null,
                email_notifications_enabled !== undefined ? email_notifications_enabled : null,
                announcement_notifications_enabled !== undefined ? announcement_notifications_enabled : null,
                updated_by || null
            ]
        );
        return result.affectedRows > 0;
    }
};

module.exports = SystemSetting;
