const pool = require('../config/db');

const Profile = {
    // Get user profile by ID
    getById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, profile_photo, role, status, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // Get user by email (for duplicate check)
    getByEmail: async (email, excludeId = null) => {
        let query = 'SELECT id, email FROM users WHERE email = ?';
        const params = [email];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // Get user by phone (for duplicate check)
    getByPhone: async (phone, excludeId = null) => {
        let query = 'SELECT id, phone FROM users WHERE phone = ?';
        const params = [phone];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // Update profile (name, email, phone)
    updateProfile: async (id, data) => {
        const { full_name, email, phone, updated_by } = data;
        const [result] = await pool.execute(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
            [full_name, email, phone, updated_by || null, id]
        );
        return result.affectedRows > 0;
    },

    // Update profile photo only
    updatePhoto: async (id, photoPath) => {
        const [result] = await pool.execute(
            'UPDATE users SET profile_photo = ?, updated_at = NOW() WHERE id = ?',
            [photoPath, id]
        );
        return result.affectedRows > 0;
    },

    // Update password
    updatePassword: async (id, hashedPassword) => {
        const [result] = await pool.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    },

    // Get current password hash (for verification)
    getPasswordHash: async (id) => {
        const [rows] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [id]
        );
        return rows[0] ? rows[0].password : null;
    }
};

module.exports = Profile;