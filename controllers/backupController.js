const cronJobs = require('../jobs/cronJobs');
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const backupController = {
    // Get all backups
    getBackups: async (req, res) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 50');
            res.json({ success: true, backups: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // Create manual backup
    createBackup: async (req, res) => {
        try {
            const result = await cronJobs.performBackup('manual', req.user.id);
            res.json({ success: true, message: 'Backup created.', ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Backup failed.' });
        }
    },

    // Download backup
    downloadBackup: async (req, res) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM system_backups WHERE id = ?', [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });

            const filePath = path.join(__dirname, '../backups', rows[0].file_name);
            if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found.' });

            res.download(filePath);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = backupController;