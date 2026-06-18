const pool = require('../config/db');
const { generateOTP } = require('../utils/helpers');

const otpService = {
    storeOTP: async (userId, email) => {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Log OTP to console for testing (remove in production)
        console.log(`========================================`);
        console.log(`OTP for ${email}: ${otp}`);
        console.log(`========================================`);

        await pool.execute(
            'INSERT INTO otp_verifications (user_id, email, otp, expires_at) VALUES (?, ?, ?, ?)',
            [userId, email, otp, expiresAt]
        );

        return otp;
    },

    verifyOTP: async (email, otp) => {
        const [rows] = await pool.execute(
            'SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND expires_at > NOW() AND is_verified = FALSE ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (rows.length === 0) {
            return null;
        }

        await pool.execute(
            'UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?',
            [rows[0].id]
        );

        return rows[0];
    }
};

module.exports = otpService;