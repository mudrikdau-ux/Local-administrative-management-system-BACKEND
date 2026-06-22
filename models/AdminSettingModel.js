const pool = require('../config/db');

const AdminSetting = {
    // ====================================
    // GET SETTINGS BY ADMIN ID
    // ====================================
    getByAdminId: async (adminId) => {
        let [rows] = await pool.execute(
            'SELECT * FROM admin_settings WHERE admin_id = ?',
            [adminId]
        );

        // Auto-create default settings if not exists
        if (rows.length === 0) {
            await pool.execute(
                'INSERT INTO admin_settings (admin_id, language, theme, email_notifications) VALUES (?, ?, ?, ?)',
                [adminId, 'english', 'light', true]
            );
            [rows] = await pool.execute(
                'SELECT * FROM admin_settings WHERE admin_id = ?',
                [adminId]
            );
        }

        return rows[0];
    },

    // ====================================
    // UPDATE SETTINGS
    // ====================================
    update: async (adminId, data) => {
        const { language, theme, email_notifications } = data;

        // Build dynamic update query
        const updates = [];
        const params = [];

        if (language !== undefined) {
            updates.push('language = ?');
            params.push(language);
        }
        if (theme !== undefined) {
            updates.push('theme = ?');
            params.push(theme);
        }
        if (email_notifications !== undefined) {
            updates.push('email_notifications = ?');
            params.push(email_notifications);
        }

        if (updates.length === 0) {
            return false;
        }

        params.push(adminId);
        const query = `UPDATE admin_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE admin_id = ?`;
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },

    // ====================================
    // UPDATE LANGUAGE ONLY
    // ====================================
    updateLanguage: async (adminId, language) => {
        const [result] = await pool.execute(
            'UPDATE admin_settings SET language = ?, updated_at = NOW() WHERE admin_id = ?',
            [language, adminId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // UPDATE THEME ONLY
    // ====================================
    updateTheme: async (adminId, theme) => {
        const [result] = await pool.execute(
            'UPDATE admin_settings SET theme = ?, updated_at = NOW() WHERE admin_id = ?',
            [theme, adminId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // UPDATE NOTIFICATIONS ONLY
    // ====================================
    updateNotifications: async (adminId, enabled) => {
        const [result] = await pool.execute(
            'UPDATE admin_settings SET email_notifications = ?, updated_at = NOW() WHERE admin_id = ?',
            [enabled, adminId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = AdminSetting;