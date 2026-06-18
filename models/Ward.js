const pool = require('../config/db');

const Ward = {
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM wards ORDER BY ward_name ASC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM wards WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (wardName) => {
        const [result] = await pool.execute(
            'INSERT INTO wards (ward_name) VALUES (?)', [wardName]
        );
        return result.insertId;
    },

    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM wards WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Ward;