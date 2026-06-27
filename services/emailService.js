const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP for login verification
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

// Send password reset token
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

// Send welcome email to newly registered citizen
const sendWelcomeEmail = async (email, citizenName, tempPassword, wardName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to LAMS - Your Citizen Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1a5276;">🏛️ LAMS</h2>
                    <p style="color: #666;">Local Administration Management System</p>
                </div>
                
                <h3 style="color: #333;">Welcome, ${citizenName}! 👋</h3>
                
                <p style="color: #555; line-height: 1.6;">
                    Your citizen account has been created by the <strong>${wardName} Ward</strong> administration.
                    You can now access the LAMS Citizen Portal to:
                </p>
                
                <ul style="color: #555; line-height: 1.8;">
                    <li>📄 Request official documents</li>
                    <li>💬 Communicate with your ward administration</li>
                    <li>📢 View ward announcements</li>
                    <li>💰 Make payments for services</li>
                    <li>👤 Manage your profile</li>
                </ul>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="color: #333; font-weight: bold; margin: 0;">Your Login Credentials</p>
                    <p style="color: #666; margin: 5px 0;">Email: <strong>${email}</strong></p>
                    <p style="color: #666; margin: 5px 0;">Temporary Password: <strong style="color: #e74c3c; font-size: 18px;">${tempPassword}</strong></p>
                </div>
                
                <p style="color: #e74c3c; font-size: 13px;">
                    ⚠️ For security reasons, please change your password after your first login.
                </p>
                
                <div style="background: #eaf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #1a5276; margin: 0; font-weight: bold;">How to Login:</p>
                    <ol style="color: #555; line-height: 1.8;">
                        <li>Visit the LAMS Citizen Portal</li>
                        <li>Enter your email: <strong>${email}</strong></li>
                        <li>Enter the temporary password above</li>
                        <li>Follow the OTP verification process</li>
                        <li>Change your password when prompted</li>
                    </ol>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                    This is an automated message from LAMS. Please do not reply to this email.<br>
                    If you did not expect this, please contact your ward administration.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send report email with attachment
const sendReportEmail = async (recipientEmail, report, generatedByName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `LAMS - ${report.report_name}`,
        html: `
            <h2>LAMS Report</h2>
            <p>Dear Recipient,</p>
            <p>Please find attached the following report:</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Report Name</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${report.report_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Report Type</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${report.report_type}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Records</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${report.record_count}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Generated By</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${generatedByName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Generated Date</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(report.created_at).toLocaleString()}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Please visit the LAMS portal to download the full report.</p>
            <p>Regards,<br>LAMS Administration</p>
        `
    };

    // Attach file if exists
    if (report.file_path) {
        const path = require('path');
        const fs = require('fs');
        const filePath = report.file_path;
        
        if (fs.existsSync(filePath)) {
            mailOptions.attachments = [
                {
                    filename: path.basename(filePath),
                    path: filePath
                }
            ];
        }
    }

    await transporter.sendMail(mailOptions);
};

// Send password reset notification to citizen
const sendPasswordResetNotification = async (email, citizenName, tempPassword) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'LAMS - Your Password Has Been Reset',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1a5276;">🏛️ LAMS</h2>
                    <p style="color: #666;">Local Administration Management System</p>
                </div>
                
                <h3 style="color: #333;">Password Reset, ${citizenName}</h3>
                
                <p style="color: #555; line-height: 1.6;">
                    Your password has been reset by your ward administration.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="color: #333; font-weight: bold; margin: 0;">Your New Login Credentials</p>
                    <p style="color: #666; margin: 5px 0;">Email: <strong>${email}</strong></p>
                    <p style="color: #666; margin: 5px 0;">Temporary Password: <strong style="color: #e74c3c; font-size: 18px;">${tempPassword}</strong></p>
                </div>
                
                <p style="color: #e74c3c; font-size: 13px;">
                    ⚠️ Please change your password after logging in.
                </p>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                    If you did not request this, please contact your ward administration immediately.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { 
    sendOTPEmail, 
    sendResetPasswordEmail, 
    sendWelcomeEmail, 
    sendReportEmail, 
    sendPasswordResetNotification 
};