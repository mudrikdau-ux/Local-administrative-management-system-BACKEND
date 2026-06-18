const pool = require('../config/db');

const Position = {
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM positions ORDER BY position_name ASC');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM positions WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (positionName) => {
        const [result] = await pool.execute(
            'INSERT INTO positions (position_name) VALUES (?)', [positionName]
        );
        return result.insertId;
    },

    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM positions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Position;