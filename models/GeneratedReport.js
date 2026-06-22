const pool = require('../config/db');

const GeneratedReport = {
    // Save report record
    create: async (data) => {
        const { report_name, report_type, file_path, file_size, filters_applied, record_count, generated_by, generated_by_name, ward_id } = data;
        const [result] = await pool.execute(
            `INSERT INTO generated_reports (report_name, report_type, file_path, file_size, filters_applied, record_count, generated_by, generated_by_name, ward_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [report_name, report_type, file_path || null, file_size || null,
             filters_applied ? JSON.stringify(filters_applied) : null,
             record_count, generated_by, generated_by_name, ward_id]
        );
        return result.insertId;
    },

        // Get all reports (with search and filter)
    getAll: async (wardId, options = {}) => {
        const { page = 1, limit = 10, search, type } = options;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM generated_reports WHERE ward_id = ?';
        let countQuery = 'SELECT COUNT(*) as count FROM generated_reports WHERE ward_id = ?';
        const queryParams = [wardId];
        const countParams = [wardId];

        if (search) {
            query += ' AND report_name LIKE ?';
            countQuery += ' AND report_name LIKE ?';
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (type) {
            query += ' AND report_type = ?';
            countQuery += ' AND report_type = ?';
            queryParams.push(type);
            countParams.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(String(limit), String(offset));

        const [rows] = await pool.execute(query, queryParams);
        const [total] = await pool.execute(countQuery, countParams);

        return {
            data: rows,
            pagination: {
                current_page: page,
                per_page: limit,
                total_records: total[0].count,
                total_pages: Math.ceil(total[0].count / limit)
            }
        };
    },
    
    // Get report by ID
    getById: async (id, wardId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM generated_reports WHERE id = ? AND ward_id = ?',
            [id, wardId]
        );
        return rows[0];
    },

    // Increment download count
    incrementDownload: async (id) => {
        await pool.execute(
            'UPDATE generated_reports SET download_count = download_count + 1 WHERE id = ?',
            [id]
        );
    },

    // Delete report
    delete: async (id) => {
        await pool.execute('DELETE FROM generated_reports WHERE id = ?', [id]);
    }
};

module.exports = GeneratedReport;