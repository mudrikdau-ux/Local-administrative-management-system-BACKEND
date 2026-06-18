const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'LAMS - OTP Verification',
        html: `
            <h2>Your OTP Code</h2>
            <p>Use the following OTP to verify your account:</p>
            <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
            <p>This OTP expires in 10 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (email, resetToken) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'LAMS - Reset Password',
        html: `
            <h2>Password Reset Request</h2>
            <p>Use the following token to reset your password:</p>
            <h1 style="color: #FF5722; font-size: 24px;">${resetToken}</h1>
            <p>This token expires in 10 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendResetPasswordEmail };