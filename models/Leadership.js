const pool = require('../config/db');

const Leadership = {
    createAssignment: async (data) => {
        const { admin_id, ward_id, position_id, assigned_by, assigned_date, start_date, end_date } = data;
        const [result] = await pool.execute(
            `INSERT INTO leadership_assignments (admin_id, ward_id, position_id, assigned_by, assigned_date, start_date, end_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [admin_id, ward_id, position_id, assigned_by, assigned_date, start_date, end_date]
        );
        return result.insertId;
    },

    createTransfer: async (data) => {
        const { admin_id, previous_ward_id, new_ward_id, previous_position_id, new_position_id, previous_leader_id, transfer_date, reason, transferred_by } = data;
        const [result] = await pool.execute(
            `INSERT INTO leadership_transfers (admin_id, previous_ward_id, new_ward_id, previous_position_id, new_position_id, previous_leader_id, transfer_date, reason, transferred_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [admin_id, previous_ward_id, new_ward_id, previous_position_id, new_position_id, previous_leader_id || null, transfer_date, reason, transferred_by]
        );
        return result.insertId;
    },

    getTransfersByAdmin: async (adminId) => {
        const [rows] = await pool.execute(`
            SELECT lt.*, 
                   pw.ward_name as previous_ward_name, nw.ward_name as new_ward_name,
                   pp.position_name as previous_position_name, np.position_name as new_position_name
            FROM leadership_transfers lt
            LEFT JOIN wards pw ON lt.previous_ward_id = pw.id
            LEFT JOIN wards nw ON lt.new_ward_id = nw.id
            LEFT JOIN positions pp ON lt.previous_position_id = pp.id
            LEFT JOIN positions np ON lt.new_position_id = np.id
            WHERE lt.admin_id = ?
            ORDER BY lt.created_at DESC
        `, [adminId]);
        return rows;
    },

    getAllTransfers: async () => {
        const [rows] = await pool.execute(`
            SELECT lt.*, a.full_name as admin_name,
                   pw.ward_name as previous_ward_name, nw.ward_name as new_ward_name,
                   pp.position_name as previous_position_name, np.position_name as new_position_name
            FROM leadership_transfers lt
            LEFT JOIN admins a ON lt.admin_id = a.id
            LEFT JOIN wards pw ON lt.previous_ward_id = pw.id
            LEFT JOIN wards nw ON lt.new_ward_id = nw.id
            LEFT JOIN positions pp ON lt.previous_position_id = pp.id
            LEFT JOIN positions np ON lt.new_position_id = np.id
            ORDER BY lt.created_at DESC
        `);
        return rows;
    },

    addHistory: async (data) => {
        const { admin_id, ward_id, position_id, action, start_date, end_date, reason, performed_by } = data;
        const [result] = await pool.execute(
            `INSERT INTO leadership_history (admin_id, ward_id, position_id, action, start_date, end_date, reason, performed_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [admin_id, ward_id, position_id, action, start_date || null, end_date || null, reason || null, performed_by]
        );
        return result.insertId;
    },

    endAssignment: async (adminId) => {
        await pool.execute(
            `UPDATE leadership_assignments SET status = 'ended' WHERE admin_id = ? AND status = 'active'`,
            [adminId]
        );
    },

    extendTerm: async (adminId, newEndDate) => {
        await pool.execute(
            `UPDATE leadership_assignments SET end_date = ? WHERE admin_id = ? AND status = 'active'`,
            [newEndDate, adminId]
        );
    },

    getActiveAssignment: async (adminId) => {
        const [rows] = await pool.execute(
            `SELECT la.*, w.ward_name, p.position_name 
             FROM leadership_assignments la
             LEFT JOIN wards w ON la.ward_id = w.id
             LEFT JOIN positions p ON la.position_id = p.id
             WHERE la.admin_id = ? AND la.status = 'active'`,
            [adminId]
        );
        return rows[0];
    }
};

module.exports = Leadership;