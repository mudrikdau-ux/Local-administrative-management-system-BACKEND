const pool = require('../config/db');

const AdminProfile = {
    // ====================================
    // GET PROFILE BY USER ID
    // ====================================
    getByUserId: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT u.id, u.full_name, u.email, u.phone, u.profile_photo, u.role, u.status,
                    u.last_login, u.created_at, u.updated_at,
                    a.id as admin_id, a.ward_id, a.position_id,
                    w.ward_name, p.position_name
             FROM users u
             LEFT JOIN admins a ON u.id = a.user_id
             LEFT JOIN wards w ON a.ward_id = w.id
             LEFT JOIN positions p ON a.position_id = p.id
             WHERE u.id = ? AND u.role = 'admin'`,
            [userId]
        );
        return rows[0];
    },

    // ====================================
    // UPDATE PROFILE
    // ====================================
    updateProfile: async (userId, data) => {
        const { full_name, email, phone } = data;
        
        // Update users table
        const [result] = await pool.execute(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ? AND role = ?',
            [full_name, email, phone, userId, 'admin']
        );

        // Also update admins table if exists
        await pool.execute(
            'UPDATE admins SET full_name = ?, email = ?, phone = ?, updated_at = NOW() WHERE user_id = ?',
            [full_name, email, phone, userId]
        );

        return result.affectedRows > 0;
    },

    // ====================================
    // CHECK UNIQUE EMAIL
    // ====================================
    getByEmail: async (email, excludeUserId = null) => {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];
        if (excludeUserId) {
            query += ' AND id != ?';
            params.push(excludeUserId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // ====================================
    // CHECK UNIQUE PHONE
    // ====================================
    getByPhone: async (phone, excludeUserId = null) => {
        let query = 'SELECT id FROM users WHERE phone = ?';
        const params = [phone];
        if (excludeUserId) {
            query += ' AND id != ?';
            params.push(excludeUserId);
        }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // ====================================
    // UPDATE PROFILE PHOTO
    // ====================================
    updatePhoto: async (userId, photoPath) => {
        // Update users table
        await pool.execute(
            'UPDATE users SET profile_photo = ?, updated_at = NOW() WHERE id = ?',
            [photoPath, userId]
        );

        // Update admins table
        await pool.execute(
            'UPDATE admins SET profile_photo = ? WHERE user_id = ?',
            [photoPath, userId]
        );
    },

    // ====================================
    // GET PASSWORD HASH
    // ====================================
    getPasswordHash: async (userId) => {
        const [rows] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        return rows[0] ? rows[0].password : null;
    },

    // ====================================
    // UPDATE PASSWORD
    // ====================================
    updatePassword: async (userId, hashedPassword) => {
        const [result] = await pool.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );
        return result.affectedRows > 0;
    },

    // ====================================
    // REMOVE PROFILE PHOTO
    // ====================================
    removePhoto: async (userId) => {
        await pool.execute(
            'UPDATE users SET profile_photo = NULL WHERE id = ?', [userId]
        );
        await pool.execute(
            'UPDATE admins SET profile_photo = NULL WHERE user_id = ?', [userId]
        );
    }
};

module.exports = AdminProfile;