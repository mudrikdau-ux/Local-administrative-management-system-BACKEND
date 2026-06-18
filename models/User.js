const pool = require('../config/db');

const User = {
    create: async (userData) => {
        const { full_name, email, phone, password, role } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, password, role, 'active']
        );
        return result.insertId;
    },

    findByEmail: async (email) => {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    updatePassword: async (id, hashedPassword) => {
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
    },

    updateStatus: async (id, status) => {
        await pool.execute(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );
    },

    getAllUsers: async () => {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, role, status, created_at FROM users'
        );
        return rows;
    },

    deleteUser: async (id) => {
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
};

module.exports = User;