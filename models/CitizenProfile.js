const pool = require('../config/db');

const CitizenProfile = {
    // Get full profile
    getProfile: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT u.id as user_id, u.full_name, u.email, u.phone, u.profile_photo, u.role, u.status as account_status,
                    u.last_login, u.created_at, u.password_changed,
                    c.id as citizen_id, c.address, c.national_id, c.gender, c.date_of_birth, c.occupation,
                    c.citizen_photo, c.status as citizen_status, c.registration_date,
                    w.ward_name
             FROM users u
             LEFT JOIN citizens c ON u.id = c.user_id
             LEFT JOIN wards w ON c.ward_id = w.id
             WHERE u.id = ? AND u.role = 'citizen'`,
            [userId]
        );
        return rows[0];
    },

    // Update profile
    updateProfile: async (userId, data) => {
        const { full_name, email, phone, address, national_id, gender, date_of_birth, occupation } = data;
        
        await pool.execute(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?',
            [full_name, email, phone, userId]
        );

        await pool.execute(
            `UPDATE citizens SET full_name = ?, email = ?, phone = ?, address = ?, national_id = ?, 
             gender = ?, date_of_birth = ?, occupation = ?, updated_at = NOW() 
             WHERE user_id = ?`,
            [full_name, email, phone, address || null, national_id || null, gender || null, 
             date_of_birth || null, occupation || null, userId]
        );
    },

    // Update profile photo
    updatePhoto: async (userId, photoPath) => {
        await pool.execute('UPDATE users SET profile_photo = ?, updated_at = NOW() WHERE id = ?', [photoPath, userId]);
        await pool.execute('UPDATE citizens SET citizen_photo = ? WHERE user_id = ?', [photoPath, userId]);
    },

    // Check unique email
    getByEmail: async (email, excludeUserId = null) => {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];
        if (excludeUserId) { query += ' AND id != ?'; params.push(excludeUserId); }
        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // Get password hash
    getPasswordHash: async (userId) => {
        const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
        return rows[0]?.password;
    },

    // Update password
    updatePassword: async (userId, hashedPassword) => {
        await pool.execute(
            'UPDATE users SET password = ?, password_changed = TRUE, temp_password = NULL, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );
    }
};

module.exports = CitizenProfile;