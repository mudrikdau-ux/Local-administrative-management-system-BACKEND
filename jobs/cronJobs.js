const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const cronJobs = {
    init: () => {
        console.log('🕐 Initializing Cron Jobs...');

        // 1. Delete expired OTPs every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                await pool.execute(
                    "DELETE FROM otp_verifications WHERE expires_at < NOW()"
                );
                await pool.execute(
                    "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE otp_expires_at < NOW()"
                );
            } catch (e) { console.error('OTP Cleanup Error:', e.message); }
        });

        // 2. Clean expired tokens daily at 2 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                await pool.execute(
                    "DELETE FROM token_blacklist WHERE blacklisted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
                );
            } catch (e) { console.error('Token Cleanup Error:', e.message); }
        });

        // 3. Clean old notifications (30+ days) daily at 3 AM
        cron.schedule('0 3 * * *', async () => {
            try {
                await pool.execute(
                    "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_read = TRUE"
                );
            } catch (e) { console.error('Notification Cleanup Error:', e.message); }
        });

        // 4. Automatic database backup daily at midnight
        cron.schedule('0 0 * * *', async () => {
            try {
                await cronJobs.performBackup('automatic', null);
            } catch (e) { console.error('Auto Backup Error:', e.message); }
        });

        // 5. Session cleanup every hour
        cron.schedule('0 * * * *', async () => {
            try {
                await pool.execute(
                    "UPDATE user_sessions SET status = 'expired' WHERE last_activity < DATE_SUB(NOW(), INTERVAL 24 HOUR)"
                );
            } catch (e) { console.error('Session Cleanup Error:', e.message); }
        });

        console.log('✅ All Cron Jobs scheduled.');
    },

    // Perform backup
    performBackup: async (type, userId) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `lams_backup_${type}_${timestamp}.sql`;
        const backupDir = path.join(__dirname, '../backups');
        
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        
        const filePath = path.join(backupDir, fileName);
        const dbName = process.env.DB_NAME || 'LAMS';
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';

        // Insert backup record
        const [result] = await pool.execute(
            'INSERT INTO system_backups (file_name, backup_type, created_by, status) VALUES (?, ?, ?, ?)',
            [fileName, type, userId, 'in_progress']
        );
        const backupId = result.insertId;

        return new Promise((resolve, reject) => {
            const cmd = `mysqldump -u ${dbUser} ${dbPass ? '-p' + dbPass : ''} ${dbName} > "${filePath}"`;
            
            exec(cmd, async (error, stdout, stderr) => {
                if (error) {
                    await pool.execute(
                        "UPDATE system_backups SET status = 'failed' WHERE id = ?", [backupId]
                    );
                    reject(error);
                } else {
                    const stats = fs.statSync(filePath);
                    await pool.execute(
                        "UPDATE system_backups SET backup_size = ?, status = 'completed' WHERE id = ?",
                        [stats.size, backupId]
                    );
                    resolve({ id: backupId, fileName, size: stats.size });
                }
            });
        });
    }
};

module.exports = cronJobs;